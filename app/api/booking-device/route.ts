import { NextResponse } from "next/server";
import { getOrCreateBookingDevice, setBookingDeviceCookie } from "@/lib/booking-device";

/**
 * Establishes the opaque, signed first-party cookie before a customer submits
 * the form. The UUID itself is never returned to JavaScript.
 */
export async function GET(request: Request) {
  const device = getOrCreateBookingDevice(request);
  const response = new NextResponse(null, { status: 204 });
  setBookingDeviceCookie(response, device);
  return response;
}
