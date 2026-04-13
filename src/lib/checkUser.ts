import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const name = `${user.firstName} ${user.lastName}`;
  const email = user.emailAddresses[0].emailAddress;

  // 1. Check if user already exists by clerkUserId
  const existingUser = await prisma.user.findUnique({
    where: { clerkUserId: user.id },
  });

  if (existingUser) {
    // Update profile info in case it changed
    return prisma.user.update({
      where: { clerkUserId: user.id },
      data: { name, imageUrl: user.imageUrl, email },
    });
  }

  // 2. Check if a user with the same email exists (stale/orphaned row)
  const existingEmailUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingEmailUser) {
    // Link this Clerk account to the existing email row
    return prisma.user.update({
      where: { email },
      data: { clerkUserId: user.id, name, imageUrl: user.imageUrl },
    });
  }

  // 3. No existing user — create a new one
  return prisma.user.create({
    data: {
      clerkUserId: user.id,
      name,
      imageUrl: user.imageUrl,
      email,
    },
  });
};
