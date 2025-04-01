import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("Fetching instances from backend...");
    const response = await fetch("http://localhost:5000/ec2/instances", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store", // Disable caching
    });

    console.log("Backend response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error response:", errorText);
      return NextResponse.json(
        { error: `Backend error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Backend response data:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching instances:", error);
    return NextResponse.json(
      { error: `Failed to fetch instances: ${error.message}` },
      { status: 500 }
    );
  }
}
