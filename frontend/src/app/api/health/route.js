import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("http://localhost:3000/health", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error checking health:", error);
    return NextResponse.json(
      { error: "Failed to check health" },
      { status: 500 }
    );
  }
}
