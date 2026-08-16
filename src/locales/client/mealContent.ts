import type { ClientLocale } from './types';

type Pair = { ar: string; fr: string };
type Cooking = { en: string; ar: string; fr: string };

const norm = (s: string) =>
  String(s || '')
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const INGREDIENTS: Record<string, Pair> = {
  almonds: { ar: 'لوز', fr: 'Amandes' },
  apples: { ar: 'تفاح', fr: 'Pommes' },
  avocado: { ar: 'أفوكا', fr: 'Avocat' },
  bananas: { ar: 'بنان', fr: 'Bananes' },
  'basmati rice': { ar: 'روز بسمتي', fr: 'Riz basmati' },
  'beef, ground, 70% lean': { ar: 'كفتة بقري 70%', fr: 'Bœuf haché 70%' },
  'beef, ground, 90% lean': { ar: 'كفتة بقري 90%', fr: 'Bœuf haché 90%' },
  'beef, steak, sirloin': { ar: 'ستيك بقري', fr: 'Steak de rumsteck' },
  blueberries: { ar: 'ميرتي', fr: 'Myrtilles' },
  broccoli: { ar: 'بروكلي', fr: 'Brocoli' },
  butter: { ar: 'زبدة', fr: 'Beurre' },
  'carrots, raw': { ar: 'خيزو', fr: 'Carottes' },
  'cheddar cheese': { ar: 'فرماج شيدر', fr: 'Fromage cheddar' },
  'cheese, low-fat cottage': { ar: 'كوتاج قليل الدسم', fr: 'Cottage allégé' },
  'cheese, regular': { ar: 'فرماج', fr: 'Fromage' },
  'chia seeds': { ar: 'بذور الشيا', fr: 'Graines de chia' },
  'chicken breast, raw': { ar: 'صدر دجاج', fr: 'Blanc de poulet' },
  'chicken, breast': { ar: 'صدر دجاج', fr: 'Blanc de poulet' },
  corn: { ar: 'مايس', fr: 'Maïs' },
  cranberries: { ar: 'كرانبري', fr: 'Canneberges' },
  cucumber: { ar: 'خيار', fr: 'Concombre' },
  'dark chocolate, 45-59% cacao': { ar: 'شوكولا كحلة 45-59%', fr: 'Chocolat noir 45-59%' },
  'dark chocolate, 70-85% cacao': { ar: 'شوكولا كحلة 70-85%', fr: 'Chocolat noir 70-85%' },
  'dark chocolate, 90%': { ar: 'شوكولا كحلة 90%', fr: 'Chocolat noir 90%' },
  dates: { ar: 'تمر', fr: 'Dattes' },
  ebly: { ar: 'إبلي', fr: 'Ebly' },
  egg: { ar: 'بيضة', fr: 'Œuf' },
  eggs: { ar: 'بيض', fr: 'Œufs' },
  garlic: { ar: 'التومة', fr: 'Ail' },
  granola: { ar: 'غرانولا', fr: 'Granola' },
  'greek yogurt, peach passion': { ar: 'ياغورت يوناني خوخ-باسيون', fr: 'Yaourt grec pêche-passion' },
  'greek yogurt, whole milk': { ar: 'ياغورت يوناني كامل', fr: 'Yaourt grec entier' },
  'green bean': { ar: 'لوبيا خضرا', fr: 'Haricot vert' },
  'green beans': { ar: 'لوبيا خضرا', fr: 'Haricots verts' },
  honey: { ar: 'عسل', fr: 'Miel' },
  'isopure creamy': { ar: 'بروتين IsoPure', fr: 'IsoPure Creamy' },
  kiwi: { ar: 'كيوي', fr: 'Kiwi' },
  'lean ground beef, raw': { ar: 'كفتة بقري قليلة الدهن', fr: 'Bœuf haché maigre' },
  'lettuce, green leaf': { ar: 'خس', fr: 'Laitue' },
  mayonnaise: { ar: 'مايونيز', fr: 'Mayonnaise' },
  'mexican mix cheese': { ar: 'فرماج مكسيكي', fr: 'Fromage mexicain' },
  milk: { ar: 'حليب', fr: 'Lait' },
  'mixed berries': { ar: 'فواكه حمرا', fr: 'Fruits rouges' },
  'mixed nuts': { ar: 'مكسرات مشكلة', fr: 'Mélange de noix' },
  mushrooms: { ar: 'الفطر', fr: 'Champignons' },
  'olive oil': { ar: 'زيت الزيتون', fr: "Huile d'olive" },
  onion: { ar: 'بصلة', fr: 'Oignon' },
  onions: { ar: 'بصل', fr: 'Oignons' },
  'optimum gold standard whey protein powder': { ar: 'واي بروتين', fr: 'Whey Gold Standard' },
  'pasta, raw': { ar: 'باتا', fr: 'Pâtes' },
  'peanut butter': { ar: 'زبدة الكاوكاو', fr: 'Beurre de cacahuète' },
  'pepper, sweet, green': { ar: 'فلفلة خضرا', fr: 'Poivron vert' },
  'pepper, sweet, yellow': { ar: 'فلفلة صفرا', fr: 'Poivron jaune' },
  perly: { ar: 'بيرلي', fr: 'Perly' },
  philadelphia: { ar: 'فيلادلفيا', fr: 'Philadelphia' },
  'plain low-fat greek yoghurt': { ar: 'ياغورت يوناني قليل الدسم', fr: 'Yaourt grec maigre' },
  'plain oats, raw': { ar: 'شوفان', fr: "Flocons d'avoine" },
  'quinoa, raw': { ar: 'كينوا', fr: 'Quinoa' },
  raisins: { ar: 'زبيب', fr: 'Raisins secs' },
  'rice cakes': { ar: 'رايس كيك', fr: 'Galettes de riz' },
  'rice, raw': { ar: 'روز', fr: 'Riz' },
  'ricotta cheese, whole milk': { ar: 'ريكوتا', fr: 'Ricotta' },
  'salmon fillet, raw': { ar: 'فيليه سالمون', fr: 'Filet de saumon' },
  shrimps: { ar: 'كروفيت', fr: 'Crevettes' },
  spinach: { ar: 'سبانخ', fr: 'Épinards' },
  'sweet potato, raw': { ar: 'بطاطا حلوة', fr: 'Patate douce' },
  tomatoes: { ar: 'مطيشة', fr: 'Tomates' },
  tuna: { ar: 'ثون', fr: 'Thon' },
  'tuna (canned)': { ar: 'ثون معلب', fr: 'Thon en conserve' },
  water: { ar: 'ما', fr: 'Eau' },
  'whole bread toast': { ar: 'توست', fr: 'Pain toasté' },
  'whole milk': { ar: 'حليب كامل', fr: 'Lait entier' },
  'whole-wheat bread': { ar: 'خبز كامل', fr: 'Pain complet' },
  'whole-wheat wrap': { ar: 'راب كامل', fr: 'Wrap complet' },
  'yellow sweet corn': { ar: 'مايس حلو', fr: 'Maïs doux' },
};

const MEAL_NAMES: Record<string, Pair> = {
  'banana shake': { ar: 'شيك بنان', fr: 'Shake à la banane' },
  'basmati rice with ground beef and broccoli': { ar: 'روز بسمتي مع كفتة و بروكلي', fr: 'Riz basmati au bœuf haché et brocoli' },
  'beef & sweet potatoes with eggs': { ar: 'لحم مع بطاطا حلوة و بيض', fr: 'Bœuf, patate douce et œufs' },
  'beef with basmati rice': { ar: 'لحم مع روز بسمتي', fr: 'Bœuf au riz basmati' },
  'beef, potato & broccoli with kiwi bowl': { ar: 'بولة لحم و بطاطا و بروكلي مع كيوي', fr: 'Bol bœuf, patate, brocoli et kiwi' },
  'cheesy scrambled eggs': { ar: 'بيض مخفوق بالفرماج', fr: 'Œufs brouillés au fromage' },
  'chicken breast salad': { ar: 'سلطة صدر دجاج', fr: 'Salade de blanc de poulet' },
  'chicken breast with pasta': { ar: 'صدر دجاج مع باتا', fr: 'Blanc de poulet aux pâtes' },
  'chicken breast with pasta & cheese': { ar: 'صدر دجاج مع باتا و فرماج', fr: 'Blanc de poulet, pâtes et fromage' },
  'egg omlet with bread and avocado': { ar: 'أومليت مع خبز و أفوكا', fr: 'Omelette, pain et avocat' },
  'egg omlet with bread cottage cheese ,avocado and berries': { ar: 'أومليت مع خبز، كوتاج، أفوكا و فواكه', fr: 'Omelette, pain, cottage, avocat et fruits' },
  'fruits shake': { ar: 'شيك الفواكه', fr: 'Shake aux fruits' },
  'greek yogurt & dark chocolate': { ar: 'ياغورت يوناني و شوكولا كحلة', fr: 'Yaourt grec et chocolat noir' },
  'greek yogurt & fruit salad': { ar: 'ياغورت يوناني و سلطة فواكه', fr: 'Yaourt grec et salade de fruits' },
  'greek yogurt bowl with scrambled eggs': { ar: 'ياغورت يوناني مع بيض مخفوق', fr: 'Bol de yaourt grec et œufs brouillés' },
  'greek yogurt chia pudding': { ar: 'بودينغ الشيا بالياغورت اليوناني', fr: 'Pudding chia au yaourt grec' },
  'greek yogurt snack': { ar: 'سناك ياغورت يوناني', fr: 'Snack yaourt grec' },
  'greek yogurt with banana and dates': { ar: 'ياغورت يوناني مع بنان و تمر', fr: 'Yaourt grec, banane et dattes' },
  'greek yogurt with fruits and scambled eggs': { ar: 'ياغورت يوناني مع فواكه و بيض مخفوق', fr: 'Yaourt grec, fruits et œufs brouillés' },
  'greek yogurt with fruits and scrambled eggs': { ar: 'ياغورت يوناني مع فواكه و بيض مخفوق', fr: 'Yaourt grec, fruits et œufs brouillés' },
  'greek yogurt with fruits and whole granola': { ar: 'ياغورت يوناني مع فواكه و غرانولا', fr: 'Yaourt grec, fruits et granola' },
  'greek yogurt with granola & nuts': { ar: 'ياغورت يوناني مع غرانولا و مكسرات', fr: 'Yaourt grec, granola et noix' },
  'ground beef with ebly and green beans': { ar: 'كفتة مع إبلي و لوبيا خضرا', fr: 'Bœuf haché, ebly et haricots verts' },
  'ground beef with pasta and avocado': { ar: 'كفتة مع باتا و أفوكا', fr: 'Bœuf haché, pâtes et avocat' },
  'ground beef with rice and avocado': { ar: 'كفتة مع روز و أفوكا', fr: 'Bœuf haché, riz et avocat' },
  'high protein beef sandwich': { ar: 'ساندويتش لحم عالي البروتين', fr: 'Sandwich bœuf hyperprotéiné' },
  'high protein shake': { ar: 'شيك عالي البروتين', fr: 'Shake hyperprotéiné' },
  'high protein shake with oatmeal and protein powder': { ar: 'شيك بروتين مع شوفان', fr: 'Shake protéiné à l’avoine' },
  'homemade chicken wrap': { ar: 'راب دجاج منزلي', fr: 'Wrap poulet maison' },
  'l1 beef & sweet potato plate': { ar: 'طبق لحم و بطاطا حلوة', fr: 'Assiette bœuf et patate douce' },
  'l2 steak & bread plate': { ar: 'طبق ستيك و خبز', fr: 'Assiette steak et pain' },
  'l4 beef wrap': { ar: 'راب لحم', fr: 'Wrap au bœuf' },
  'l5 steak sweet-potato bowl': { ar: 'بولة ستيك و بطاطا حلوة', fr: 'Bol steak et patate douce' },
  'oatmeal & fruits': { ar: 'شوفان و فواكه', fr: 'Avoine et fruits' },
  'oatmeal & protein bowl': { ar: 'شوفان بالبروتين', fr: 'Bol d’avoine protéiné' },
  'oatmeal and eggs pancakes': { ar: 'بانكيك شوفان و بيض', fr: 'Pancakes avoine et œufs' },
  'oatmeal and eggs with whey protein': { ar: 'شوفان و بيض مع واي', fr: 'Avoine, œufs et whey' },
  'quinoa and chicken breast salad': { ar: 'سلطة كينوا و صدر دجاج', fr: 'Salade quinoa et poulet' },
  'riccotta with toast and honey': { ar: 'ريكوتا مع توست و عسل', fr: 'Ricotta, toast et miel' },
  'rice & chicken breast with broccoli': { ar: 'روز و صدر دجاج مع بروكلي', fr: 'Riz, poulet et brocoli' },
  'rice & chicken breast with green beans': { ar: 'روز و صدر دجاج مع لوبيا خضرا', fr: 'Riz, poulet et haricots verts' },
  'rice & chicken breast with green beans & cucumber': { ar: 'روز و صدر دجاج مع لوبيا و خيار', fr: 'Riz, poulet, haricots verts et concombre' },
  'rice cakes with peanut butter': { ar: 'رايس كيك بزبدة الكاوكاو', fr: 'Galettes de riz au beurre de cacahuète' },
  'rice with chicken breast and broccoli': { ar: 'روز مع صدر دجاج و بروكلي', fr: 'Riz au poulet et brocoli' },
  'salmon with sweet potatoes': { ar: 'سالمون مع بطاطا حلوة', fr: 'Saumon et patates douces' },
  'scrambled eggs with avocado and cheese': { ar: 'بيض مخفوق مع أفوكا و فرماج', fr: 'Œufs brouillés, avocat et fromage' },
  'scrambled eggs with avocado and philadelphia': { ar: 'بيض مخفوق مع أفوكا و فيلادلفيا', fr: 'Œufs brouillés, avocat et Philadelphia' },
  'scrambled eggs with avocado and shrimps': { ar: 'بيض مخفوق مع أفوكا و كروفيت', fr: 'Œufs brouillés, avocat et crevettes' },
  'scrambled eggs with oatmeal': { ar: 'بيض مخفوق مع شوفان', fr: 'Œufs brouillés et avoine' },
  'shrimps & avocado toast': { ar: 'توست كروفيت و أفوكا', fr: 'Toast crevettes et avocat' },
  'steak, potato & kiwi': { ar: 'ستيك، بطاطا و كيوي', fr: 'Steak, patate et kiwi' },
  'sweet potatoes with chicken breast': { ar: 'بطاطا حلوة مع صدر دجاج', fr: 'Patates douces et blanc de poulet' },
  'sweet potatoes with chicken breast & spinach': { ar: 'بطاطا حلوة مع صدر دجاج و سبانخ', fr: 'Patates douces, poulet et épinards' },
  'toast with avocado & eggs': { ar: 'توست مع أفوكا و بيض', fr: 'Toast avocat et œufs' },
  'toast with chicken breast': { ar: 'توست مع صدر دجاج', fr: 'Toast au blanc de poulet' },
  'toast with eggs & ground beef': { ar: 'توست مع بيض و كفتة', fr: 'Toast œufs et bœuf haché' },
  'toast with scrambled eggs & cheese': { ar: 'توست مع بيض مخفوق و فرماج', fr: 'Toast œufs brouillés et fromage' },
  'tuna & pasta with veggies': { ar: 'ثون و باتا مع خضر', fr: 'Thon, pâtes et légumes' },
  'tuna and rice salad': { ar: 'سلطة ثون و روز', fr: 'Salade thon et riz' },
  'whey, banana and dates': { ar: 'واي مع بنان و تمر', fr: 'Whey, banane et dattes' },
};

/** English cooking text is the source of truth written to the database when a meal has none. */
export const COOKING_BY_MEAL: Record<string, Cooking> = {
  'banana shake': {
    en: 'Add the milk, banana, peanut butter, mixed nuts, and dark chocolate to a blender. Blend until smooth and creamy. Serve immediately.',
    ar: 'حط الحليب، البنن، زبدة الكاوكاو، المكسرات و الشوكولا الكحلة في الخلاط. خلط حتى يولي كريمي. شربو دغيا.',
    fr: 'Mets le lait, la banane, le beurre de cacahuète, les noix et le chocolat noir dans un blender. Mixe jusqu’à obtenir une texture lisse. Sers tout de suite.',
  },
  'basmati rice with ground beef and broccoli': {
    en: 'Cook the basmati rice in boiled water until soft. Pan-fry the ground beef in olive oil until browned, then add broccoli and cheese. Serve the beef and broccoli over the rice.',
    ar: 'طيب الروز البسمتي في الماء حتى يطرى. قلي الكفتة في زيت الزيتون حتى تحمر، زيد البروكلي و الفرماج. قدّم الكفتة و البروكلي فوق الروز.',
    fr: 'Cuis le riz basmati dans l’eau bouillante jusqu’à ce qu’il soit tendre. Fais revenir le bœuf haché dans l’huile d’olive, puis ajoute le brocoli et le fromage. Sers sur le riz.',
  },
  'beef & sweet potatoes with eggs': {
    en: 'Cook the lean ground beef in olive oil until browned. Roast or boil the sweet potato until soft. Fry the eggs and serve everything together with grated cheese on top.',
    ar: 'طيب الكفتة في زيت الزيتون حتى تحمر. طيب البطاطا الحلوة حتى تطرى. قلي البيض و قدّم كلشي مع فرماج من الفوق.',
    fr: 'Fais revenir le bœuf haché maigre dans l’huile d’olive. Cuis la patate douce jusqu’à ce qu’elle soit tendre. Fais les œufs et sers le tout avec du fromage râpé.',
  },
  'beef with basmati rice': {
    en: 'Cook the basmati rice in boiled water until soft. Pan-fry the lean ground beef in olive oil with broccoli until cooked, then add cheddar cheese and raisins. Serve the beef mixture over the rice.',
    ar: 'طيب الروز البسمتي حتى يطرى. قلي الكفتة مع البروكلي في زيت الزيتون، زيد الشيدر و الزبيب. قدّم الخليط فوق الروز.',
    fr: 'Cuis le riz basmati. Fais revenir le bœuf haché maigre avec le brocoli, puis ajoute le cheddar et les raisins secs. Sers sur le riz.',
  },
  'beef, potato & broccoli with kiwi bowl': {
    en: 'Cook lean beef and sweet potato. Steam broccoli. Finish with kiwi and a little avocado.',
    ar: 'طيب اللحم القليل الدهن و البطاطا الحلوة. طيب البروكلي على البخار. زيد الكيوي و شوية أفوكا.',
    fr: 'Cuis le bœuf maigre et la patate douce. Fais cuire le brocoli à la vapeur. Termine avec le kiwi et un peu d’avocat.',
  },
  'cheesy scrambled eggs': {
    en: 'Beat eggs and blend them with finely chopped spinach. Heat tablespoon of olive oil in a non-stick skillet, and pour in the egg mixture. As the eggs begin to set, sprinkle over the reduced amount of shredded cheese. Serve this alongside a slice of toasted whole bread and a cup of Milk',
    ar: 'خفق البيض مع سبانخ مقطعة رقيق. سخّن معلقة زيت الزيتون في مقلاة و صب الخليط. ملي يبدا يثبت، رش الفرماج. قدّم مع توست و كاس حليب.',
    fr: 'Bats les œufs avec les épinards ciselés. Chauffe une cuillère d’huile d’olive et verse le mélange. Quand ça prend, ajoute le fromage. Sers avec une tartine et un verre de lait.',
  },
  'chicken breast salad': {
    en: 'Cook the chicken breast and slice it. Cook the Ebly according to package directions. In a bowl, combine chicken, Ebly, cucumber, avocado, cheddar cheese, and a drizzle of olive oil.',
    ar: 'طيب صدر الدجاج و قطّعو. طيب الإبلي بحال ما مكتوب. في زلافة، خلط الدجاج، الإبلي، الخيار، الأفوكا، الشيدر و شوية زيت الزيتون.',
    fr: 'Cuis le blanc de poulet et coupe-le. Cuis l’Ebly selon le paquet. Mélange poulet, Ebly, concombre, avocat, cheddar et un filet d’huile d’olive.',
  },
  'chicken breast with pasta': {
    en: 'Cook the pasta in boiled water and add your favourite seasoning. Add olive oil to a frying pan to avoid sticking and cook the chicken breast with garlic and mushrooms. When cooked, mix with the pasta, cheese, and mayonnaise.',
    ar: 'طيب الباتا في الماء و زيد التوابل لي بغيتي. حط زيت الزيتون في المقلاة و طيب صدر الدجاج مع التومة و الفطر. ملي يطيب، خلطو مع الباتا، الفرماج و المايونيز.',
    fr: 'Cuis les pâtes à l’eau bouillante avec tes épices. Fais cuire le poulet avec l’ail et les champignons dans un peu d’huile d’olive. Mélange ensuite avec les pâtes, le fromage et la mayonnaise.',
  },
  'chicken breast with pasta & cheese': {
    en: 'Boil Pasta in Water, Add 1 tbsp of olive oil to a frying pan and cook the chicken breast under medium heat along with the mushrooms, when cooked , mix everything ( cucumber slices , mexican cheese , garlic slices )',
    ar: 'سلق الباتا في الماء. حط معلقة زيت الزيتون في المقلاة و طيب صدر الدجاج مع الفطر على نار متوسطة. ملي يطيب، خلط كلشي (خيار، فرماج مكسيكي، شرائح التومة).',
    fr: 'Fais bouillir les pâtes. Dans une poêle avec 1 c. à soupe d’huile d’olive, cuis le poulet et les champignons à feu moyen. Mélange ensuite avec le concombre, le fromage mexicain et l’ail.',
  },
  'egg omlet with bread and avocado': {
    en: 'Whisk three large eggs and scramble them in a non-stick skillet over medium heat until they are fully cooked but still moist. While the eggs are cooking, toast a slice of whole wheat bread and spread a tablespoon of peanut butter over it. Top the toast with sliced avocado. On the side, arrange half a sliced banana. Serve the scrambled eggs alongside the peanut butter and avocado toast, creating a nutritious and satisfying meal.',
    ar: 'خفق 3 بيضات و طيبهم في مقلاة على نار متوسطة حتى يطيبو و يبقاو رطبين. في نفس الوقت، حمص التوست و دهنو بزبدة الكاوكاو، زيد شرائح الأفوكا. حط نص بنانة مقطعة على الجنب. قدّم البيض مع التوست.',
    fr: 'Bats 3 œufs et brouille-les à feu moyen, cuits mais encore moelleux. Pendant ce temps, toaste le pain, étale le beurre de cacahuète et ajoute l’avocat. Sers avec la moitié d’une banane tranchée.',
  },
  'egg omlet with bread cottage cheese ,avocado and berries': {
    en: 'Whisk eggs and scramble them in a non-stick skillet over medium heat until they are fully cooked. While the eggs are cooking, toast the whole wheat toast , mash avocado and top the toast with cottage cheese & mashed avocado. Add the Scrambled Eggs and take the meal along with a Protein Shake ( wit water ) , don\'t forget the berries at the end.',
    ar: 'خفق البيض و طيبو حتى يطيب. حمص التوست، هرسي الأفوكا و حط الكوتاج مع الأفوكا فوق التوست. زيد البيض المخفوق، خذ الشيك ديال البروتين بالما، و ما تنساش الفواكه الحمرا.',
    fr: 'Brouille les œufs à feu moyen. Toaste le pain, écrase l’avocat et étale cottage + avocat. Ajoute les œufs, prends le shake protéiné (avec de l’eau) et n’oublie pas les fruits rouges.',
  },
  'fruits shake': {
    en: 'Blend the whole milk with banana, apple, peanut butter, mixed nuts, and raw oats until smooth. Serve cold.',
    ar: 'خلط الحليب الكامل مع البنن، التفاح، زبدة الكاوكاو، المكسرات و الشوفان حتى يولي ناعم. قدّمو بارد.',
    fr: 'Mixe le lait entier avec la banane, la pomme, le beurre de cacahuète, les noix et l’avoine jusqu’à obtenir une texture lisse. Sers froid.',
  },
  'greek yogurt & dark chocolate': {
    en: 'Spoon the Greek yogurt into a bowl. Top with chopped dark chocolate and fresh blueberries. Serve cold.',
    ar: 'حط الياغورت اليوناني في زلافة. زيد شوكولا كحلة مقطعة و ميرتي. قدّمو بارد.',
    fr: 'Verse le yaourt grec dans un bol. Ajoute le chocolat noir haché et les myrtilles. Sers froid.',
  },
  'greek yogurt & fruit salad': {
    en: 'Ina bowl, mix greek yogurt with fruits, nuts and whey protein',
    ar: 'في زلافة، خلط الياغورت اليوناني مع الفواكه، المكسرات و الواي بروتين.',
    fr: 'Dans un bol, mélange le yaourt grec avec les fruits, les noix et la whey.',
  },
  'greek yogurt bowl with scrambled eggs': {
    en: 'In a bowl, add the greek yogurt and top it with blueberries and granola. In a separate frying pan, stir in a small tablespoon and cook the scrambled eggs, when cooked , mash the avocado over the toast and add the scramled eggs on top.',
    ar: 'في زلافة، حط الياغورت اليوناني و زيد الميرتي و الغرانولا. في مقلاة، طيب البيض المخفوق. هرسي الأفوكا فوق التوست و زيد البيض من الفوق.',
    fr: 'Dans un bol, mets le yaourt grec, les myrtilles et le granola. Brouille les œufs à part. Écrase l’avocat sur le toast et pose les œufs dessus.',
  },
  'greek yogurt chia pudding': {
    en: 'Mix chia seeds , banana slices and nuts with greek yogurt to make a healthy delicious pudding.',
    ar: 'خلط بذور الشيا، شرائح البنن و المكسرات مع الياغورت اليوناني باش تدير بودينغ بنين.',
    fr: 'Mélange les graines de chia, les tranches de banane et les noix avec le yaourt grec pour un pudding simple.',
  },
  'greek yogurt snack': {
    en: 'Spoon the Greek yogurt into a bowl. Top with sliced banana, apple, and mixed nuts. Serve cold.',
    ar: 'حط الياغورت اليوناني في زلافة. زيد بنان مقطع، تفاح و مكسرات. قدّمو بارد.',
    fr: 'Verse le yaourt grec dans un bol. Ajoute banane, pomme et mélange de noix. Sers froid.',
  },
  'greek yogurt with banana and dates': {
    en: 'Spoon the Greek yogurt into a bowl. Top with sliced banana and chopped dates. Serve cold.',
    ar: 'حط الياغورت اليوناني في زلافة. زيد بنان مقطع و تمر مقطع. قدّمو بارد.',
    fr: 'Verse le yaourt grec dans un bol. Ajoute la banane tranchée et les dattes coupées. Sers froid.',
  },
  'greek yogurt with fruits and scambled eggs': {
    en: 'Spoon the Greek yogurt into a bowl. Top with  sliced banana, blueberries and chopped dark chocolate . Serve it With a plate of scrambled Eggs and 1 Toast.',
    ar: 'حط الياغورت اليوناني في زلافة. زيد بنان، ميرتي و شوكولا كحلة. قدّمو مع طبق بيض مخفوق و توست.',
    fr: 'Verse le yaourt grec dans un bol. Ajoute banane, myrtilles et chocolat noir. Sers avec des œufs brouillés et 1 toast.',
  },
  'greek yogurt with fruits and scrambled eggs': {
    en: 'Spoon the Greek yogurt into a bowl. Top with  sliced banana, blueberries and chopped dark chocolate . Serve it With a plate of scrambled Eggs and 1 Toast.',
    ar: 'حط الياغورت اليوناني في زلافة. زيد بنان، ميرتي و شوكولا كحلة. قدّمو مع طبق بيض مخفوق و توست.',
    fr: 'Verse le yaourt grec dans un bol. Ajoute banane, myrtilles et chocolat noir. Sers avec des œufs brouillés et 1 toast.',
  },
  'greek yogurt with fruits and whole granola': {
    en: 'Spoon the Greek yogurt into a bowl. Top with granola, sliced banana, blueberries, chopped dark chocolate, and mixed nuts. Serve cold.',
    ar: 'حط الياغورت اليوناني في زلافة. زيد غرانولا، بنان، ميرتي، شوكولا كحلة و مكسرات. قدّمو بارد.',
    fr: 'Verse le yaourt grec dans un bol. Ajoute granola, banane, myrtilles, chocolat noir et noix. Sers froid.',
  },
  'greek yogurt with granola & nuts': {
    en: 'Spoon the Greek yogurt into a bowl. Top with granola and fresh blueberries. Serve cold.',
    ar: 'حط الياغورت اليوناني في زلافة. زيد الغرانولا و الميرتي. قدّمو بارد.',
    fr: 'Verse le yaourt grec dans un bol. Ajoute le granola et les myrtilles. Sers froid.',
  },
  'ground beef with ebly and green beans': {
    en: 'To make your meal, boil Ebly grains and green beans . In a frying pan , add olive oil to a frying pan to avoid sticking and cook the beef along with garlic slices and your favourite seasonning. When cooked , mix everything and add cheddar cheese to mix.',
    ar: 'سلق الإبلي و اللوبيا الخضرا. في مقلاة بزيت الزيتون، طيب الكفتة مع التومة و التوابل. ملي يطيب، خلط كلشي و زيد الشيدر.',
    fr: 'Fais bouillir l’Ebly et les haricots verts. Dans une poêle huilée, cuis le bœuf avec l’ail et tes épices. Mélange le tout et ajoute le cheddar.',
  },
  'ground beef with pasta and avocado': {
    en: 'Cook the pasta in Boiled Water and add you favourite seasonning. Add olive oil to a frying pan to avoid sticking and cook the beef and onion, when cooked, add the cheese, cut avocado and lettuce to small slices and mix everything',
    ar: 'طيب الباتا في الماء مع التوابل. قلي الكفتة و البصل في زيت الزيتون، زيد الفرماج، قطّع الأفوكا و الخس و خلط كلشي.',
    fr: 'Cuis les pâtes avec tes épices. Fais revenir le bœuf et l’oignon, ajoute le fromage, l’avocat et la laitue coupés, puis mélange.',
  },
  'ground beef with rice and avocado': {
    en: 'Cook the rice in Boiled Water and add you favourite seasonning. Add olive oil to a frying pan to avoid sticking and cook the beef and onion, when cooked, add the cheese, cut avocado to small slices and mix everything.',
    ar: 'طيب الروز في الماء مع التوابل. قلي الكفتة و البصل، زيد الفرماج و شرائح الأفوكا و خلط كلشي.',
    fr: 'Cuis le riz avec tes épices. Fais revenir le bœuf et l’oignon, ajoute le fromage et l’avocat, puis mélange.',
  },
  'high protein beef sandwich': {
    en: 'Cook the ground beef in olive oil until browned. Warm the whole-wheat wrap, fill with the beef, cheddar cheese, and mashed avocado. Roll tightly and serve.',
    ar: 'طيب الكفتة في زيت الزيتون حتى تحمر. سخّن الراب، عمّرو باللحم، الشيدر و الأفوكا مهرسة. لفّو مزيان و قدّمو.',
    fr: 'Fais revenir le bœuf haché. Réchauffe le wrap, garnis avec le bœuf, le cheddar et l’avocat écrasé. Roule bien et sers.',
  },
  'high protein shake': {
    en: 'Simply Mix the Ingredients in a Blender',
    ar: 'غير خلط المكونات في الخلاط.',
    fr: 'Mixe simplement tous les ingrédients au blender.',
  },
  'high protein shake with oatmeal and protein powder': {
    en: 'Simply Mix the Ingredients in a Blender',
    ar: 'غير خلط المكونات في الخلاط.',
    fr: 'Mixe simplement tous les ingrédients au blender.',
  },
  'homemade chicken wrap': {
    en: 'Warm the whole-wheat wrap. Fill it with sliced chicken breast, cucumber, grated carrots, and mashed avocado. Roll tightly and serve.',
    ar: 'سخّن الراب. عمّرو بصدر الدجاج، الخيار، الخيزو مبشور و الأفوكا مهرسة. لفّو مزيان و قدّمو.',
    fr: 'Réchauffe le wrap. Garnis avec le poulet, le concombre, les carottes râpées et l’avocat. Roule bien et sers.',
  },
  'l1 beef & sweet potato plate': {
    en: 'Cook lean beef. Bake or steam sweet potato and broccoli. Plate with avocado and a sprinkle of Mexican mix cheese.',
    ar: 'طيب اللحم القليل الدهن. طيب البطاطا الحلوة و البروكلي. قدّم مع أفوكا و شوية فرماج مكسيكي.',
    fr: 'Cuis le bœuf maigre. Cuis la patate douce et le brocoli. Dresse avec l’avocat et un peu de fromage mexicain.',
  },
  'l2 steak & bread plate': {
    en: 'Grill or pan-sear sirloin steak. Serve with whole-wheat bread, cooked broccoli, avocado, and cucumber.',
    ar: 'شوي الستيك أو قليه. قدّمو مع خبز كامل، بروكلي، أفوكا و خيار.',
    fr: 'Grille ou saisis le steak. Sers avec pain complet, brocoli, avocat et concombre.',
  },
  'l4 beef wrap': {
    en: 'Fill wrap with cooked lean beef, Mexican mix cheese, and avocado. Serve sweet potato and broccoli on the side.',
    ar: 'عمّر الراب باللحم، الفرماج المكسيكي و الأفوكا. قدّم البطاطا الحلوة و البروكلي على الجنب.',
    fr: 'Garnis le wrap avec le bœuf, le fromage mexicain et l’avocat. Sers patate douce et brocoli à côté.',
  },
  'l5 steak sweet-potato bowl': {
    en: 'Cook sirloin steak. Bake sweet potato. Serve in a bowl with broccoli and avocado.',
    ar: 'طيب الستيك. طيب البطاطا الحلوة. قدّم في زلافة مع بروكلي و أفوكا.',
    fr: 'Cuis le steak. Enfourne la patate douce. Sers en bol avec brocoli et avocat.',
  },
  'oatmeal & fruits': {
    en: 'In a Bowl, Cook the oatmeal in water under medium to low heat, add honey for better taste.',
    ar: 'في زلافة، طيب الشوفان في الما على نار مهيلة، زيد العسل باش يجيك بنين.',
    fr: 'Dans un bol, cuis l’avoine dans l’eau à feu doux et ajoute du miel pour le goût.',
  },
  'oatmeal & protein bowl': {
    en: 'To make your meal, boil milk and add oatmeal, cooking until soft. Stir in a tablespoon of peanut butter. Top the oatmeal with sliced banana, peanut butter, dark chocolate and whey protein scoop.',
    ar: 'غلي الحليب و زيد الشوفان حتى يطرى. حرّك معلقة زبدة الكاوكاو. زيد بنان، شوكولا كحلة و سكوب واي.',
    fr: 'Fais chauffer le lait, ajoute l’avoine jusqu’à ce que ce soit tendre. Incorpore une cuillère de beurre de cacahuète. Garnis avec banane, chocolat noir et une dose de whey.',
  },
  'oatmeal and eggs pancakes': {
    en: 'Create a pancake batter by mixing the oatmeal, milk, whole eggs, and egg whites. Mash the banana and incorporate it into the batter along with the peanut butter and honey for natural sweetness. Cook the pancakes in a non-stick skillet over medium heat until bubbles form and the edges appear dry, then flip to cook the other side. Serve the pancakes with a dollop of Perly yogurt on top and sprinkle with shaved dark chocolate.',
    ar: 'خلط الشوفان، الحليب، البيض و بياض البيض. هرسي البننة و زيدها مع زبدة الكاوكاو و العسل. طيب البانكيك في مقلاة حتى يبانو الفقاعات، قلبو. قدّم مع بيرلي و شوكولا كحلة.',
    fr: 'Mélange avoine, lait, œufs et blancs. Ajoute la banane écrasée, le beurre de cacahuète et le miel. Cuis les pancakes à feu moyen, retourne-les, puis sers avec Perly et chocolat noir.',
  },
  'oatmeal and eggs with whey protein': {
    en: 'To make your meal, boil milk and add oatmeal, cooking until soft. Stir in a tablespoon of peanut butter. Cut Bananas into small slices and add them to the oatmeal along with a scoop of whey protein to the mixture. Finally add some almonds for taste and magnesium boost.',
    ar: 'غلي الحليب و زيد الشوفان حتى يطرى. حرّك معلقة زبدة الكاوكاو. قطّع البنن و زيد سكوب واي. في الآخر زيد شوية لوز.',
    fr: 'Fais chauffer le lait avec l’avoine. Ajoute une cuillère de beurre de cacahuète, la banane et une dose de whey. Termine avec quelques amandes.',
  },
  'quinoa and chicken breast salad': {
    en: 'To make your meal, cook the quinoa until tender and pan-fry the chicken in olive oil until golden. In a bowl, dice the avocado and mix everything with the mexican cheese and cucmber slices',
    ar: 'طيب الكينوا حتى تطرى و قلي الدجاج في زيت الزيتون حتى يحمر. قطّع الأفوكا و خلط كلشي مع الفرماج المكسيكي و الخيار.',
    fr: 'Cuis le quinoa et fais dorer le poulet. Coupe l’avocat et mélange avec le fromage mexicain et le concombre.',
  },
  'riccotta with toast and honey': {
    en: 'Toast the bread. Spread ricotta on top, drizzle with honey, and serve with sliced banana.',
    ar: 'حمص التوست. دهن الريكوتا، رش العسل، و قدّم مع بنان مقطع.',
    fr: 'Toaste le pain. Étale la ricotta, verse un filet de miel, et sers avec de la banane.',
  },
  'rice & chicken breast with broccoli': {
    en: 'Cook the rice and broccoli in Boiled Water and add you favourite seasonning. Add olive oil to a frying pan to avoid sticking and cook the chicken breast and onion, when cooked, add the cheese and mix everything in a bowl.',
    ar: 'طيب الروز و البروكلي في الماء مع التوابل. قلي صدر الدجاج و البصل في زيت الزيتون، زيد الفرماج و خلط في زلافة.',
    fr: 'Cuis le riz et le brocoli. Fais revenir le poulet et l’oignon, ajoute le fromage et mélange dans un bol.',
  },
  'rice & chicken breast with green beans': {
    en: 'Cook the rice and green beans in Boiled Water and add you favourite seasonning. Add olive oil to a frying pan to avoid sticking and cook the chicken breast and onion, when cooked, add the cheese and mix everything in a bowl.',
    ar: 'طيب الروز و اللوبيا الخضرا في الماء مع التوابل. قلي صدر الدجاج و البصل، زيد الفرماج و خلط في زلافة.',
    fr: 'Cuis le riz et les haricots verts. Fais revenir le poulet et l’oignon, ajoute le fromage et mélange.',
  },
  'rice & chicken breast with green beans & cucumber': {
    en: 'Cook the basmati rice in boiled water until soft. Steam or boil the green beans until tender. Pan-fry the chicken breast in olive oil until golden and cooked through, then slice it. Serve the chicken over the rice with green beans, fresh cucumber, and grated cheese on top.',
    ar: 'طيب الروز البسمتي حتى يطرى. طيب اللوبيا الخضرا. قلي صدر الدجاج حتى يحمر و قطّعو. قدّم الدجاج فوق الروز مع اللوبيا، الخيار و الفرماج.',
    fr: 'Cuis le riz basmati. Cuis les haricots verts. Fais dorer le poulet, puis sers-le sur le riz avec haricots, concombre et fromage.',
  },
  'rice cakes with peanut butter': {
    en: 'Spread peanut butter on the rice cakes. Serve with sliced banana on the side.',
    ar: 'دهن زبدة الكاوكاو على الرايس كيك. قدّم مع بنان مقطع على الجنب.',
    fr: 'Étale le beurre de cacahuète sur les galettes de riz. Sers avec de la banane à côté.',
  },
  'rice with chicken breast and broccoli': {
    en: 'Cook the rice and broccoli in Boiled Water and add you favourite seasonning. Add olive oil to a frying pan to avoid sticking and cook the chicken breast and onion, when cooked, add the cheese and mix everything in a bowl.',
    ar: 'طيب الروز و البروكلي في الماء مع التوابل. قلي صدر الدجاج و البصل، زيد الفرماج و خلط في زلافة.',
    fr: 'Cuis le riz et le brocoli. Fais revenir le poulet et l’oignon, ajoute le fromage et mélange.',
  },
  'salmon with sweet potatoes': {
    en: 'Season the salmon fillet and bake or pan-sear until cooked through. Chop the sweet potato, peppers, broccoli and onion, toss with melted butter, and roast until tender. Serve together.',
    ar: 'تبّل فيليه السالمون و طيبو في الفرن أو المقلاة. قطّع البطاطا الحلوة، الفلفلة، البروكلي و البصل مع زبدة، و طيبهم حتى يطريو. قدّم كلشي مجموعين.',
    fr: 'Assaisonne le saumon et cuis-le au four ou à la poêle. Rôtis patate douce, poivrons, brocoli et oignon avec du beurre. Sers ensemble.',
  },
  'scrambled eggs with avocado and cheese': {
    en: 'Heat a tablespoon of olive oil in a pan and scramble eggs until they are set but still creamy. Meanwhile, mash avocado and spread it evenly over slices of whole wheat bread. Lay the scrambled eggs on top of the mashed avocado, and top with sliced cheddar cheese.',
    ar: 'سخّن معلقة زيت الزيتون و طيب البيض مخفوق كريمي. هرسي الأفوكا على الخبز الكامل، زيد البيض و شرائح الشيدر.',
    fr: 'Brouille les œufs dans un peu d’huile d’olive, encore crémeux. Écrase l’avocat sur le pain, ajoute les œufs et le cheddar.',
  },
  'scrambled eggs with avocado and philadelphia': {
    en: 'Heat the olive oil in a non-stick skillet and scramble the eggs with a splash of whole milk until soft and creamy. Toast the whole bread, spread Philadelphia over it, and top with sliced avocado and the scrambled eggs. Serve warm.',
    ar: 'قلي البيض مع شوية حليب حتى يولي كريمي. حمص التوست، دهن فيلادلفيا، زيد الأفوكا و البيض. قدّمو سخون.',
    fr: 'Brouille les œufs avec un peu de lait. Toaste le pain, étale le Philadelphia, ajoute avocat et œufs. Sers chaud.',
  },
  'scrambled eggs with avocado and shrimps': {
    en: 'Scramble the eggs in butter until soft. Toast the whole bread, top with mashed avocado and cooked shrimps. Serve warm with a glass of orange juice on the side.',
    ar: 'طيب البيض في الزبدة. حمص التوست، حط أفوكا مهرسة و كروفيت. قدّمو سخون.',
    fr: 'Brouille les œufs dans le beurre. Toaste le pain, ajoute avocat et crevettes. Sers chaud.',
  },
  'scrambled eggs with oatmeal': {
    en: 'Start by cooking the oatmeal in milk until creamy and soft. While the oatmeal is cooking, beat the eggs and then scramble them in a skillet with a tablespoon of olive oil, ensuring they remain fluffy and light. Once both the oatmeal and eggs are ready, stir a tablespoon of peanut butter into the oatmeal for extra richness. Serve the scrambled eggs alongside the oatmeal and sprinkle the blueberries over the oatmeal for a burst of freshness and sweetness.',
    ar: 'طيب الشوفان في الحليب حتى يولي كريمي. في نفس الوقت طيب البيض المخفوق في زيت الزيتون. حرّك معلقة زبدة الكاوكاو في الشوفان. قدّم البيض مع الشوفان و رش الميرتي.',
    fr: 'Cuis l’avoine dans le lait. Brouille les œufs à part. Ajoute une cuillère de beurre de cacahuète dans l’avoine. Sers avec les œufs et des myrtilles.',
  },
  'shrimps & avocado toast': {
    en: 'Toast the bread. Mash the avocado with onion and spread it on the toast. Cook the shrimps in a pan, add cheese, and serve on top.',
    ar: 'حمص التوست. هرسي الأفوكا مع البصل و دهن التوست. طيب الكروفيت، زيد الفرماج و حطهم من الفوق.',
    fr: 'Toaste le pain. Écrase l’avocat avec l’oignon et étale. Cuis les crevettes, ajoute le fromage et pose le tout sur le toast.',
  },
  'steak, potato & kiwi': {
    en: 'Cook sirloin steak and sweet potato. Steam broccoli. Serve with sliced kiwi and a small amount of avocado.',
    ar: 'طيب الستيك و البطاطا الحلوة. طيب البروكلي على البخار. قدّم مع كيوي و شوية أفوكا.',
    fr: 'Cuis le steak et la patate douce. Fais le brocoli à la vapeur. Sers avec kiwi et un peu d’avocat.',
  },
  'sweet potatoes with chicken breast': {
    en: 'To make your meal, boil potatoes and broccoli, cooking until soft. Stir in a tablespoon of olive oil. Cook the chicken breast in the oven, keep the onion fresh and cut it into small slices, same for the avocado then mix everything in a bowl',
    ar: 'سلق البطاطا و البروكلي حتى يطريو. زيد معلقة زيت الزيتون. طيب صدر الدجاج في الفرن، قطّع البصل و الأفوكا طريين و خلط كلشي في زلافة.',
    fr: 'Fais bouillir patates et brocoli. Ajoute une cuillère d’huile d’olive. Cuis le poulet au four, coupe oignon et avocat crus, puis mélange le tout.',
  },
  'sweet potatoes with chicken breast & spinach': {
    en: 'To make your meal, boil potatoes and broccoli, cooking until soft. Stir in a tablespoon of olive oil. Cook the chicken breast in the oven, keep the onion fresh and cut it into small slices, same for the avocado then mix everything in a bowl',
    ar: 'سلق البطاطا و البروكلي حتى يطريو. زيد معلقة زيت الزيتون. طيب صدر الدجاج في الفرن، قطّع البصل و الأفوكا و خلط كلشي في زلافة.',
    fr: 'Fais bouillir patates et brocoli. Ajoute une cuillère d’huile d’olive. Cuis le poulet au four, coupe oignon et avocat, puis mélange.',
  },
  'toast with avocado & eggs': {
    en: 'Stir Olive Oil in a frying pan , and prepare an Omlet , When ready , mash avocado and philadlphia cheese on the Toast , and top with the omlet , take the milk separatly in a cup.',
    ar: 'حط زيت الزيتون في المقلاة و دير أومليت. هرسي الأفوكا و الفيلادلفيا على التوست و زيد الأومليت. الحليب خذيه في كاس على حدة.',
    fr: 'Fais une omelette dans un peu d’huile d’olive. Écrase avocat et Philadelphia sur le toast, ajoute l’omelette. Prends le lait à part.',
  },
  'toast with chicken breast': {
    en: 'Pan-fry the chicken breast in olive oil until cooked through, then slice it. Toast the whole bread, top with sliced avocado, chicken, cheddar cheese, and onion. Serve warm.',
    ar: 'قلي صدر الدجاج في زيت الزيتون و قطّعو. حمص التوست، زيد أفوكا، دجاج، شيدر و بصل. قدّمو سخون.',
    fr: 'Fais cuire le poulet, puis coupe-le. Toaste le pain, ajoute avocat, poulet, cheddar et oignon. Sers chaud.',
  },
  'toast with eggs & ground beef': {
    en: 'Cook the ground beef in olive oil until browned. Toast the whole bread and top with the beef. Fry or scramble the eggs and place them on top. Serve warm.',
    ar: 'طيب الكفتة في زيت الزيتون حتى تحمر. حمص التوست و حط اللحم. زيد البيض مقلي أو مخفوق من الفوق. قدّمو سخون.',
    fr: 'Fais revenir le bœuf haché. Toaste le pain, ajoute le bœuf, puis les œufs. Sers chaud.',
  },
  'toast with scrambled eggs & cheese': {
    en: 'Toast the whole-wheat bread. Stir in a small tbsp of Olive Oil in a frying pan and prepare the scrambled eggs. Melt Mexican mix cheese on toast and add eggs. Mix ON Whey with Milk as a side shake. And finish with the Kiwi.',
    ar: 'حمص الخبز الكامل. طيب البيض المخفوق في شوية زيت الزيتون. ذوّب الفرماج المكسيكي على التوست و زيد البيض. خلط الواي مع الحليب كشيك، و كمّل بالكيوي.',
    fr: 'Toaste le pain. Brouille les œufs. Fais fondre le fromage mexicain sur le toast et ajoute les œufs. Mixe la whey avec le lait, et termine avec le kiwi.',
  },
  'tuna & pasta with veggies': {
    en: 'Cook the pasta in boiled water until soft . In another bowl  cut avocado to small slices along with the fresh onion , mix everything with the cooked pasta and add cheddar cheese, tuna as well as your favourite seaoning.',
    ar: 'طيب الباتا حتى تطرى. قطّع الأفوكا و البصل، خلطهم مع الباتا، زيد الشيدر، الثون و التوابل.',
    fr: 'Cuis les pâtes. Coupe avocat et oignon, mélange avec les pâtes, le cheddar, le thon et tes épices.',
  },
  'tuna and rice salad': {
    en: 'Cook the rice in boiled water until soft , when cooked , add a tuna can to the rice along wit avocado slices , corn and cheddar cheese.',
    ar: 'طيب الروز حتى يطرى. زيد علبة ثون، شرائح الأفوكا، المايس و الشيدر.',
    fr: 'Cuis le riz. Ajoute le thon, l’avocat, le maïs et le cheddar.',
  },
  'whey, banana and dates': {
    en: 'Add water, banana, dates, and protein powder to a blender. Blend until smooth. Serve immediately.',
    ar: 'حط الما، البنن، التمر و البروتين في الخلاط. خلط حتى يولي ناعم. شربو دغيا.',
    fr: 'Mets l’eau, la banane, les dattes et la protéine dans un blender. Mixe jusqu’à obtenir une texture lisse. Sers tout de suite.',
  },
};

export function translateIngredientName(name: string, locale: ClientLocale): string {
  if (!name || locale === 'en') return name;
  const hit = INGREDIENTS[norm(name)];
  return hit?.[locale] || name;
}

export function translateMealName(name: string, locale: ClientLocale): string {
  if (!name || locale === 'en') return name;
  const hit = MEAL_NAMES[norm(name)];
  return hit?.[locale] || name;
}

export function translateCookingInstructions(
  mealName: string,
  stored: string | undefined,
  locale: ClientLocale
): string {
  const row = COOKING_BY_MEAL[norm(mealName)];
  if (locale === 'en') {
    const text = (stored || '').trim();
    return text || row?.en || '';
  }
  return row?.[locale] || (stored || '').trim() || row?.en || '';
}

export function englishCookingForMeal(mealName: string): string {
  return COOKING_BY_MEAL[norm(mealName)]?.en || '';
}
