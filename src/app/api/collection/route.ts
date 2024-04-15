import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isLogin } from "@/lib/utils";
import { collectionCreationSchema } from "@/schemas/collection";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (userId) {
      const collection = await prisma.collection.findMany({
        where: {
          userId: Number(userId),
        },
      });

      return NextResponse.json(
        {
          collection,
        },
        {
          status: 200,
        }
      );
    }

    const collections = await prisma.collection.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        book: true,
      },
    });
    return NextResponse.json(
      {
        collections,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error getting collections:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isLogin(req)) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }
  try {
    const body = await req.json();
    const { userId, bookId } = collectionCreationSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      return NextResponse.json(
        {
          error: "User not found.",
        },
        {
          status: 404,
        }
      );
    }

    const book = await prisma.book.findUnique({
      where: {
        id: bookId,
      },
    });
    if (!book) {
      return NextResponse.json(
        {
          error: "Book not found.",
        },
        {
          status: 404,
        }
      );
    }

    const existingCollection = await prisma.collection.findFirst({
      where: {
        userId,
        bookId,
      },
    });

    if (existingCollection) {
      return NextResponse.json(
        {
          error: "Collection already exists.",
        },
        {
          status: 400,
        }
      );
    }

    const collection = await prisma.collection.create({
      data: {
        userId,
        bookId,
      },
    });

    return NextResponse.json(
      {
        collection,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Error creating collection:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred.", message: error },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!isLogin(req)) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }
  try {
    const { searchParams } = new URL(req.url);
    const collectionId = searchParams.get("id");
    const collection = await prisma.collection.findUnique({
      where: {
        id: Number(collectionId),
      },
    });

    if (!collection) {
      return NextResponse.json(
        {
          error: "Collection not found.",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.collection.delete({
      where: {
        id: Number(collectionId),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "collection deleted.",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error deleting collection:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      {
        status: 500,
      }
    );
  }
}
