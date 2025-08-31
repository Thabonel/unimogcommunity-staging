-- WIS EPC Sample Data
-- Run this after the tables are created

-- Insert Unimog models
INSERT INTO wis_models (model_code, model_name, year_from, year_to, specifications) VALUES
('U1300L', 'Unimog U1300L', 1976, 1989, '{"engineOptions": ["OM352", "OM366"], "transmissionOptions": ["UG3/40", "UG3/65"], "axleOptions": ["Portal axles", "Planetary hubs"]}'::jsonb),
('U1700', 'Unimog U1700', 1988, 2000, '{"engineOptions": ["OM366", "OM366A"], "transmissionOptions": ["UG3/65", "UG3/70"], "axleOptions": ["Portal axles", "Planetary hubs"]}'::jsonb),
('U4000', 'Unimog U4000', 2000, 2013, '{"engineOptions": ["OM904LA", "OM906LA"], "transmissionOptions": ["UG100/8", "G240-16"], "axleOptions": ["Portal axles"]}'::jsonb),
('U5000', 'Unimog U5000', 2002, 2013, '{"engineOptions": ["OM906LA"], "transmissionOptions": ["G210-16", "G240-16"], "axleOptions": ["Portal axles"]}'::jsonb),
('U5023', 'Unimog U5023', 2013, 2023, '{"engineOptions": ["OM936LA"], "transmissionOptions": ["UG100/8"], "axleOptions": ["Portal axles"]}'::jsonb)
ON CONFLICT (model_code) DO UPDATE SET
  model_name = EXCLUDED.model_name,
  year_from = EXCLUDED.year_from,
  year_to = EXCLUDED.year_to;

-- Insert sample procedures
INSERT INTO wis_procedures (procedure_code, title, model, system, subsystem, content, steps, tools_required, parts_required, safety_warnings, time_estimate, difficulty) VALUES
('ENGINE-001', 'Engine Oil and Filter Change', 'U1300L', 'Engine', 'Lubrication', 
'<h2>Engine Oil and Filter Change Procedure</h2>
<p>This procedure covers the complete oil and filter change for the OM352 engine in the Unimog U1300L.</p>

<h3>Safety Warnings</h3>
<ul>
  <li>Ensure engine is warm but not hot (60-80°C)</li>
  <li>Use proper PPE including gloves and safety glasses</li>
  <li>Dispose of used oil properly</li>
</ul>

<h3>Required Tools</h3>
<ul>
  <li>27mm socket for drain plug</li>
  <li>Oil filter wrench</li>
  <li>Oil drain pan (min 15L capacity)</li>
  <li>New drain plug gasket</li>
</ul>

<h3>Procedure</h3>
<ol>
  <li>Position vehicle on level ground</li>
  <li>Warm engine to operating temperature</li>
  <li>Turn off engine and wait 5 minutes</li>
  <li>Place drain pan under oil pan</li>
  <li>Remove drain plug and allow oil to drain completely</li>
  <li>Remove old oil filter</li>
  <li>Clean filter mounting surface</li>
  <li>Apply clean oil to new filter gasket</li>
  <li>Install new filter (hand tight plus 3/4 turn)</li>
  <li>Install drain plug with new gasket (torque: 60 Nm)</li>
  <li>Add new oil through filler cap</li>
  <li>Start engine and check for leaks</li>
  <li>Check oil level after engine cools</li>
</ol>',
'[{"step": 1, "description": "Position vehicle on level ground", "timeMinutes": 5}, {"step": 2, "description": "Warm engine to operating temperature", "timeMinutes": 10}, {"step": 3, "description": "Turn off engine and wait 5 minutes", "timeMinutes": 5}, {"step": 4, "description": "Drain old oil", "timeMinutes": 15}, {"step": 5, "description": "Replace oil filter", "timeMinutes": 10}, {"step": 6, "description": "Add new oil", "timeMinutes": 10}, {"step": 7, "description": "Start engine and check", "timeMinutes": 5}]'::jsonb,
ARRAY['27mm socket', 'Oil filter wrench', 'Oil drain pan', 'Torque wrench'],
ARRAY['A0001802609', 'A0001800109'],
ARRAY['Hot oil hazard', 'Proper disposal required', 'Use PPE'],
60, 'easy'),

('TRANS-001', 'Manual Transmission Fluid Change', 'U1300L', 'Transmission', 'Maintenance',
'<h2>Manual Transmission Fluid Change</h2><p>Complete procedure for changing transmission fluid in UG3/40 gearbox.</p>',
'[{"step": 1, "description": "Warm transmission to operating temperature", "timeMinutes": 15}, {"step": 2, "description": "Remove fill and drain plugs", "timeMinutes": 10}, {"step": 3, "description": "Drain old fluid completely", "timeMinutes": 20}, {"step": 4, "description": "Install drain plug", "timeMinutes": 5}, {"step": 5, "description": "Fill with new fluid to level", "timeMinutes": 15}]'::jsonb,
ARRAY['24mm hex socket', 'Fluid pump', 'Drain pan'],
ARRAY['A0019897803'],
ARRAY['Hot fluid hazard', 'Use proper PPE'],
65, 'medium'),

('BRAKE-001', 'Front Brake Pad Replacement', 'U1700', 'Brakes', 'Front Axle',
'<h2>Front Brake Pad Replacement</h2><p>Step-by-step guide for replacing front brake pads on U1700.</p>',
'[{"step": 1, "description": "Secure vehicle and remove wheels", "timeMinutes": 20}, {"step": 2, "description": "Remove caliper bolts", "timeMinutes": 10}, {"step": 3, "description": "Remove old pads and hardware", "timeMinutes": 10}, {"step": 4, "description": "Compress caliper piston", "timeMinutes": 10}, {"step": 5, "description": "Install new pads and hardware", "timeMinutes": 15}, {"step": 6, "description": "Reinstall caliper and wheels", "timeMinutes": 20}, {"step": 7, "description": "Bed in new pads", "timeMinutes": 15}]'::jsonb,
ARRAY['19mm socket', '22mm socket', 'Caliper piston tool', 'Torque wrench'],
ARRAY['A0034201220', 'A0034201020'],
ARRAY['Support vehicle properly', 'Brake dust hazard', 'Test brakes before driving'],
100, 'medium')
ON CONFLICT (procedure_code) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content;

-- Insert sample parts
INSERT INTO wis_parts (part_number, description, category, models, price, availability, specifications) VALUES
('A0001802609', 'Oil Filter - OM352/OM366 Engine', 'Engine', ARRAY['U1300L', 'U1700', 'U4000'], 24.50, 'In Stock',
'{"type": "Spin-on filter", "thread": "M27x2", "height": "145mm", "diameter": "93mm", "manufacturer": "Mann Filter"}'::jsonb),

('A0001800109', 'Drain Plug Gasket - Copper', 'Engine', ARRAY['U1300L', 'U1700', 'U4000', 'U5000'], 2.80, 'In Stock',
'{"innerDiameter": "28mm", "outerDiameter": "34mm", "thickness": "2mm", "material": "Copper"}'::jsonb),

('A0034201220', 'Front Brake Pad Set - Heavy Duty', 'Brakes', ARRAY['U1700', 'U4000'], 185.00, 'In Stock',
'{"width": "180mm", "height": "75mm", "thickness": "20mm", "wearIndicator": true}'::jsonb),

('A0019897803', 'Manual Transmission Fluid - MB 235.1', 'Transmission', ARRAY['U1300L', 'U1700', 'U4000', 'U5000', 'U5023'], 28.90, 'In Stock',
'{"viscosity": "80W-90", "specification": "MB 235.1", "volume": "1L", "type": "Mineral"}'::jsonb)
ON CONFLICT (part_number) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price;

-- Insert sample bulletins
INSERT INTO wis_bulletins (bulletin_number, title, models_affected, issue_date, category, content, priority) VALUES
('TSB-2023-001', 'Updated Torque Specifications for Engine Mounts', ARRAY['U4000', 'U5000', 'U5023'], '2023-03-15', 'Engine',
'New torque specifications for engine mount bolts to prevent loosening. Front mounts: 180 Nm, Rear mounts: 200 Nm.', 'recommended'),

('RECALL-2022-003', 'Brake Line Inspection Required', ARRAY['U5023'], '2022-11-20', 'Brakes',
'Mandatory inspection of brake lines for vehicles manufactured between 2020-2022. Check for corrosion at frame attachment points.', 'mandatory')
ON CONFLICT (bulletin_number) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content;

-- Test the search function
SELECT * FROM search_wis_content('oil') LIMIT 5;
SELECT * FROM search_wis_content('brake') LIMIT 5;

-- Verify data was inserted
SELECT 'Models:', COUNT(*) FROM wis_models;
SELECT 'Procedures:', COUNT(*) FROM wis_procedures;
SELECT 'Parts:', COUNT(*) FROM wis_parts;
SELECT 'Bulletins:', COUNT(*) FROM wis_bulletins;