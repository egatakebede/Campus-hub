ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Listing" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ServiceProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Bookmark" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Report" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."_prisma_migrations" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campus_hub_public_read_active_categories"
  ON public."Category"
  FOR SELECT
  TO anon, authenticated
  USING ("isActive" = true);

CREATE POLICY "campus_hub_public_read_active_listings"
  ON public."Listing"
  FOR SELECT
  TO anon, authenticated
  USING ("status" = 'ACTIVE' AND "deletedAt" IS NULL);

CREATE POLICY "campus_hub_public_read_active_services"
  ON public."ServiceProfile"
  FOR SELECT
  TO anon, authenticated
  USING ("isActive" = true AND "deletedAt" IS NULL);
