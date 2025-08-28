-- Seed sample data for community_recommendations
INSERT INTO community_recommendations (
    supplier_name,
    category,
    description,
    location,
    website_url,
    author_id,
    author_name,
    author_avatar,
    rating,
    likes
) VALUES (
    'Mog Repair Specialists',
    'Repair',
    'Trusted workshop for all Unimog repairs.',
    'Berlin, Germany',
    'https://mogspecialists.example.com',
    gen_random_uuid(),
    'Admin User',
    NULL,
    5,
    0
);
