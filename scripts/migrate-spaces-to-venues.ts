/**
 * One-time data migration: creates a Venue for each existing Space that has
 * no venue yet, copying the location/description fields, then links the
 * Space to its new Venue.
 *
 * Run with: pnpm tsx scripts/migrate-spaces-to-venues.ts
 */
import { prisma } from "../packages/db/src/client.ts";

async function main() {
  const spaces = await prisma.space.findMany({
    where: { venueId: null },
    select: {
      id: true,
      name: true,
      shortDescription: true,
      description: true,
      images: true,
      address: true,
      city: true,
      state: true,
      country: true,
      postalCode: true,
      latitude: true,
      longitude: true,
      hostId: true,
    },
  });

  console.log(`Found ${spaces.length} spaces without a venue`);

  for (const space of spaces) {
    const venue = await prisma.venue.create({
      data: {
        name: space.name,
        shortDescription: space.shortDescription,
        description: space.description,
        images: space.images,
        address: space.address,
        city: space.city,
        state: space.state,
        country: space.country,
        postalCode: space.postalCode,
        latitude: space.latitude,
        longitude: space.longitude,
        hostId: space.hostId,
      },
    });

    await prisma.space.update({
      where: { id: space.id },
      data: { venueId: venue.id },
    });

    console.log(
      `Created venue "${venue.name}" (id=${venue.id}) for space id=${space.id}`,
    );
  }

  // Verify no spaces are left without a venue
  const orphans = await prisma.space.count({ where: { venueId: null } });
  if (orphans > 0) {
    console.error(`ERROR: ${orphans} spaces still have no venue!`);
    process.exit(1);
  }

  console.log("Migration complete. All spaces linked to venues.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
