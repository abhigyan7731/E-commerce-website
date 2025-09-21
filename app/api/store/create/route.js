import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma'; // Ensure this path is correct
import imagekit from '@/configs/imageKit'; // Ensure this path is correct

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get("name");
    // ... get all your other form data fields ...

    // Your logic to validate data, upload the image, and save to the database goes here.

    // If everything is successful:
    return NextResponse.json({ message: "Store application submitted successfully!" }, { status: 201 });

  } catch (error) {
    console.error("Error creating store:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
