const { PrismaClient } = require("@prisma/client");

async function testDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log("Testing database connection...");
    
    // Test stations
    console.log("\n=== Testing Stations ===");
    const stations = await prisma.station.findMany();
    console.log("Stations count:", stations.length);
    console.log("Stations:", JSON.stringify(stations, null, 2));
    
    // Test categories
    console.log("\n=== Testing Categories ===");
    const categories = await prisma.dishCategory.findMany();
    console.log("Categories count:", categories.length);
    console.log("Categories:", JSON.stringify(categories, null, 2));
    
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
