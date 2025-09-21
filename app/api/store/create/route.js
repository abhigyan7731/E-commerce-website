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
    const logo = formData.get("logo") || ""; // Set default if missing
    // Ensure user exists before creating store
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      // Create user with minimal info if not found
      user = await prisma.user.create({
        data: {
          id: userId,
          name: formData.get("name") || "Unknown",
          email: formData.get("email") || "unknown@example.com",
          image: "", // Set default or get from Clerk
        }
      });
    }
    const storeData = {
      name,
      username: formData.get("username"),
      email: formData.get("email"),
      contact: formData.get("contact"),
      logo,
      description: formData.get("description"),
      address: formData.get("address"),
      user: { connect: { id: userId } }, // Connect to existing user
      // status, isActive, etc. will use defaults
    };
    const store = await prisma.store.create({ data: storeData });
    return NextResponse.json({ message: "Store application submitted successfully!", store }, { status: 201 });

  } catch (error) {
    console.error("Error creating store:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
