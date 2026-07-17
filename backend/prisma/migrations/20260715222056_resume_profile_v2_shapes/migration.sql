-- AlterTable
ALTER TABLE "ResumeProfile" ADD COLUMN     "contact" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "education" JSONB NOT NULL DEFAULT '[]',
DROP COLUMN "summary",
ADD COLUMN     "summary" JSONB NOT NULL DEFAULT '[]',
ALTER COLUMN "skills" SET DEFAULT '[]',
ALTER COLUMN "experience" SET DEFAULT '[]',
ALTER COLUMN "projects" SET DEFAULT '[]',
ALTER COLUMN "research" SET DEFAULT '[]',
ALTER COLUMN "involvement" SET DEFAULT '[]';

-- AlterTable
ALTER TABLE "ResumeVersion" ADD COLUMN     "jobDescription" TEXT,
ADD COLUMN     "selectionDescriptor" JSONB;

