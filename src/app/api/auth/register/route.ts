import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const assignedRole = email.toLowerCase() === "admin@gmail.com" ? "admin" : "user";

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: assignedRole,
      authProvider: "credentials",
    });

    return NextResponse.json({ message: "User registered successfully", user: { id: newUser._id, email: newUser.email, role: newUser.role } }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
