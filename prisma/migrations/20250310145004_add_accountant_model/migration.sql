-- CreateTable
CREATE TABLE "Accountant" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Accountant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Accountant_username_key" ON "Accountant"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Accountant_email_key" ON "Accountant"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Accountant_phone_key" ON "Accountant"("phone");
