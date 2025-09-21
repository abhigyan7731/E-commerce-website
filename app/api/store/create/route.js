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
    // Example: create a new store record
    // You must collect all required fields from formData
    const storeData = {
      userId,
      name,
      // Add other required fields here, e.g.:
      username: formData.get("username"),
      email: formData.get("email"),
      contact: formData.get("contact"),
      logo: formData.get("logo"), // or result of image upload
      description: formData.get("description"),
      address: formData.get("address"),
      // status, isActive, etc. will use defaults
    };
    const store = await prisma.store.create({ data: storeData });
    return NextResponse.json({ message: "Store application submitted successfully!", store }, { status: 201 });

  } catch (error) {
    console.error("Error creating store:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
