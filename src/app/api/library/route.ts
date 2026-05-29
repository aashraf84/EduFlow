import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    if (!schoolId) {
      return NextResponse.json({ success: false, error: 'schoolId is required' }, { status: 400 })
    }

    const where: Prisma.LibraryBookWhereInput = { schoolId }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { author: { contains: search } },
        { isbn: { contains: search } },
        { publisher: { contains: search } },
      ]
    }

    if (category && category !== 'all') {
      where.category = category
    }

    if (status) {
      where.status = status
    }

    const [books, total] = await Promise.all([
      db.libraryBook.findMany({
        where,
        include: {
          issues: {
            where: { status: { in: ['issued', 'overdue'] } },
            include: {
              student: {
                select: { id: true, firstName: true, lastName: true, admissionNo: true },
              },
            },
            orderBy: { issueDate: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.libraryBook.count({ where }),
    ])

    // Stats
    const [totalBooksAgg, availableBooksAgg, issuedBooks, overdueBooks] = await Promise.all([
      db.libraryBook.aggregate({ where: { schoolId }, _sum: { totalCopies: true } }),
      db.libraryBook.aggregate({ where: { schoolId }, _sum: { availableCopies: true } }),
      db.bookIssue.count({ where: { schoolId, status: 'issued' } }),
      db.bookIssue.count({ where: { schoolId, status: 'issued', dueDate: { lt: new Date() } } }),
    ])

    // All issues for tracking tab
    const issues = await db.bookIssue.findMany({
      where: { schoolId },
      include: {
        book: { select: { id: true, title: true, author: true } },
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
      },
      orderBy: { issueDate: 'desc' },
      take: 50,
    })

    // Category breakdown for analytics
    const categoryBreakdown = await db.libraryBook.groupBy({
      by: ['category'],
      where: { schoolId },
      _count: { category: true },
      _sum: { totalCopies: true, availableCopies: true },
    })

    return NextResponse.json({
      success: true,
      data: {
        books,
        issues,
        stats: {
          totalBooks: totalBooksAgg._sum.totalCopies || 0,
          availableBooks: availableBooksAgg._sum.availableCopies || 0,
          issuedBooks,
          overdueBooks,
        },
        categoryBreakdown: categoryBreakdown.map(c => ({
          category: c.category,
          count: c._count.category,
          totalCopies: c._sum.totalCopies || 0,
          availableCopies: c._sum.availableCopies || 0,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Library GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      schoolId, title, author, isbn, publisher, category,
      totalCopies, shelfLocation, price,
    } = body

    if (!schoolId || !title || !author) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: schoolId, title, author' },
        { status: 400 }
      )
    }

    const copies = totalCopies ? parseInt(String(totalCopies)) : 1
    const book = await db.libraryBook.create({
      data: {
        schoolId,
        title,
        author,
        isbn: isbn || null,
        publisher: publisher || null,
        category: category || null,
        totalCopies: copies,
        availableCopies: copies,
        shelfLocation: shelfLocation || null,
        price: price ? parseFloat(String(price)) : null,
        status: 'available',
      },
    })

    return NextResponse.json({ success: true, data: { book } }, { status: 201 })
  } catch (error) {
    console.error('Library POST error:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { success: false, error: 'A book with this ISBN already exists' },
          { status: 409 }
        )
      }
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - issue/return book
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, issueId, bookId } = body

    if (action === 'return' && issueId) {
      const issue = await db.bookIssue.update({
        where: { id: issueId },
        data: { status: 'returned', returnDate: new Date() },
      })
      if (issue.bookId) {
        await db.libraryBook.update({
          where: { id: issue.bookId },
          data: { availableCopies: { increment: 1 } },
        })
      }
      return NextResponse.json({ success: true, data: { issue } })
    }

    if (action === 'issue' && bookId) {
      const { studentId, dueDate } = body
      if (!studentId || !dueDate) {
        return NextResponse.json({ success: false, error: 'studentId and dueDate required' }, { status: 400 })
      }
      const book = await db.libraryBook.findUnique({ where: { id: bookId } })
      if (!book || book.availableCopies <= 0) {
        return NextResponse.json({ success: false, error: 'Book not available' }, { status: 400 })
      }
      const issue = await db.bookIssue.create({
        data: {
          schoolId: book.schoolId,
          bookId,
          studentId,
          dueDate: new Date(dueDate),
          status: 'issued',
        },
      })
      await db.libraryBook.update({
        where: { id: bookId },
        data: { availableCopies: { decrement: 1 } },
      })
      return NextResponse.json({ success: true, data: { issue } }, { status: 201 })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Library PATCH error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update' }, { status: 500 })
  }
}
