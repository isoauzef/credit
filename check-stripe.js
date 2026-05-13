const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

(async () => {
  const settings = await p.setting.findMany({
    where: { key: { contains: "stripe" } }
  });
  
  settings.forEach(s => {
    const val = s.key.includes("secret") || s.key.includes("key") 
      ? (s.value ? s.value.substring(0, 15) + "..." : "EMPTY") 
      : s.value;
    console.log(s.key + " = " + val);
  });

  await p.$disconnect();
})();
