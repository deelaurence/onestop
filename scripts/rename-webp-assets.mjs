import { rename } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(__dirname, '../src/assets');

const mapping = {
  'DEB 2E_1.webp': 'wedding-bride-church-aisle-procession.webp',
  'DEB 2E_2.webp': 'wedding-ceremony-church-wide-interior.webp',
  'DEB 2E_3.webp': 'wedding-ceremony-couple-seated-reading.webp',
  'DEB 2E_4.webp': 'wedding-altar-bridal-party-portrait.webp',
  'DEB 2E_6.webp': 'wedding-reception-first-dance.webp',
  'DEB 2E_77.webp': 'wedding-couple-laughing-garden-arch.webp',
  'DEB 2E_102.webp': 'wedding-couple-deck-balcony-embrace.webp',
  'DEB 2E_119.webp': 'wedding-couple-intimate-portrait-outdoor.webp',
  'DEB 2E_144.webp': 'wedding-event-guest-guitarist-waving.webp',
  'DEB 2E_169.webp': 'wedding-guests-two-women-portrait.webp',
  'DEB 2E_176.webp': 'wedding-guests-group-outdoor-portrait.webp',
  'DEB 2E_178.webp': 'wedding-party-vintage-clock-outdoor.webp',
  'DEB 2E_204.webp': 'wedding-ceremony-aisle-procession-outdoor.webp',
  'DEB 2E_231.webp': 'wedding-couple-embrace-forest-portrait.webp',
  'DEB 2E_268.webp': 'wedding-bride-aisle-outdoor-guests.webp',
  'DEB 2E_274.webp': 'wedding-bride-parents-aisle-procession.webp',
  'DEB 2E_322.webp': 'wedding-garden-ceremony-wide-overview.webp',
  'DEB 2E_329.webp': 'wedding-ceremony-garden-videographer-wide.webp',
  'DEB 2E_438.webp': 'wedding-reception-guests-couple-portrait.webp',
  'DEB 2E_440.webp': 'wedding-ceremony-outdoor-arch-officiant.webp',
  'DEB 2E_681.webp': 'wedding-couple-aisle-exit-bubbles.webp',
  'DEB 2E_738.webp': 'wedding-guests-candid-selfie.webp',
  'DEB 2E_826.webp': 'wedding-party-playful-bubble-guns.webp',
  'DEB 21E_19.webp': 'studio-portrait-couple-armchair-formal.webp',
  'DEB 22E_51.webp': 'studio-portrait-couple-standing-hands.webp',
  'DEB 23E_247.webp': 'portrait-woman-traditional-striped-tunic.webp',
  'DEB 23E_289.webp': 'studio-portrait-woman-stool-monochrome.webp',
  'DEB 24E_1.webp': 'portrait-woman-formal-gele-stool-handbag.webp',
  'DEB 24E_250.webp': 'portrait-man-dashiki-striped-studio.webp',
  'DEB 25E_287.webp': 'studio-portrait-couple-back-to-back-jackets.webp',
  'DEB 26E_310.webp': 'studio-portrait-couple-lift-playful.webp',
  'DEB 27E_353.webp': 'studio-portrait-couple-formal-closeup.webp',
  'DEB 28E_384.webp': 'studio-portrait-couple-elegant-headshot.webp',
  'DSC_0033.webp': 'portrait-woman-beige-blazer-headshot.webp',
  'DSC_0062.webp': 'portrait-woman-houndstooth-blazer-headshot.webp',
  'DSC_0069.webp': 'portrait-woman-business-suit-hands-hips.webp',
  'DSC_0071.webp': 'portrait-woman-business-suit-blazer-pose.webp',
  'DSC_0110.webp': 'school-graduation-woman-kente-stole-headshot.webp',
  'DSC_0111.webp': 'school-graduation-woman-regalia-portrait.webp',
  'DSC_0149.webp': 'school-graduation-woman-holding-diploma.webp',
  'DSC_0150.webp': 'school-graduation-woman-kente-diploma.webp',
  'DSC_0171.webp': 'portrait-nurse-navy-scrubs-full-length.webp',
  'DSC_0175.webp': 'school-nursing-student-scrubs-portrait.webp',
  'DSC_0187.webp': 'portrait-nurse-scrubs-playful-pose.webp',
  'DSC_0373.webp': 'landscape-shipwreck-beach-sunset.webp',
  'DSC_0441.webp': 'school-boy-grenville-uniform-portrait.webp',
  'DSC_0715.webp': 'school-girl-grenville-uniform-portrait.webp',
  'DSC_1884.webp': 'portrait-woman-colorful-blouse-studio.webp',
  'DSC_1898.webp': 'portrait-woman-colorful-dress-clutch.webp',
  'DSC_1908.webp': 'portrait-woman-night-sky-composite.webp',
  'DSC_1925.webp': 'portrait-woman-colorful-dress-joyful-pose.webp',
  'DSC_1939.webp': 'portrait-woman-colorful-dress-full-length.webp',
  'DSC_5473.webp': 'wedding-group-portrait-waving-formal.webp',
  'DSC_9722.webp': 'event-catering-fruit-skewer-detail.webp',
  '_DSF3769.webp': 'commercial-catering-salad-buffet-spread.webp',
  '_DSF3837.webp': 'commercial-food-roasted-chicken-plantains.webp',
  '_DSF3846.webp': 'commercial-food-jollof-rice-chicken.webp',
  '_DSF3873.webp': 'commercial-food-fufu-vegetable-stew.webp',
  '_FRA7881.webp': 'portrait-man-traditional-kaftan-headshot.webp',
  '_FRA8585.webp': 'school-girl-blazer-tie-portrait.webp',
  '_FRA8635.webp': 'school-girl-uniform-smiling-portrait.webp',
  '8.webp': 'school-panorama-students-staff-assembly.webp',
  'Larg.webp': 'portrait-woman-formal-gele-lace-gown-full.webp',
  'ommm.webp': 'school-panorama-students-bridge-outdoor.webp',
  'panorama 2.webp': 'school-panorama-students-staff-turf.webp',
};

const values = Object.values(mapping);
if (new Set(values).size !== values.length) {
  throw new Error('Duplicate target filenames detected');
}

for (const [oldName, newName] of Object.entries(mapping)) {
  const from = join(ASSETS, oldName);
  const to = join(ASSETS, newName);
  await rename(from, to);
  console.log(`${oldName} → ${newName}`);
}

console.log(`\nRenamed ${Object.keys(mapping).length} files.`);
