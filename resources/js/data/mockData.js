export const mockCourses = [
  { id: '1', title_ar: 'أساسيات تداول الفوركس', title_en: 'Forex Trading Fundamentals', category: 'forex', duration_ar: '6 أسابيع', duration_en: '6 Weeks', price: 299, description_ar: 'تعلم أساسيات سوق العملات الأجنبية، أزواج العملات، والتحليل الفني والأساسي لبدء رحلتك في التداول.', description_en: 'Learn the basics of forex markets, currency pairs, and technical & fundamental analysis to start your trading journey.', level_ar: 'مبتدئ', level_en: 'Beginner', sessions: 12, enrolled: 1234 },
  { id: '2', title_ar: 'التحليل الفني المتقدم', title_en: 'Advanced Technical Analysis', category: 'forex', duration_ar: '8 أسابيع', duration_en: '8 Weeks', price: 499, description_ar: 'إتقان الشموع اليابانية، مؤشرات RSI و MACD، واستراتيجيات الدعم والمقاومة المتقدمة.', description_en: 'Master candlestick patterns, RSI & MACD indicators, and advanced support/resistance strategies.', level_ar: 'متقدم', level_en: 'Advanced', sessions: 16, enrolled: 876 },
  { id: '3', title_ar: 'تداول العملات الرقمية', title_en: 'Cryptocurrency Trading', category: 'crypto', duration_ar: '5 أسابيع', duration_en: '5 Weeks', price: 399, description_ar: 'دليلك الشامل لتداول البيتكوين والإيثريوم والعملات البديلة مع استراتيجيات إدارة المخاطر.', description_en: 'Complete guide to trading Bitcoin, Ethereum & altcoins with risk management strategies.', level_ar: 'مبتدئ', level_en: 'Beginner', sessions: 10, enrolled: 2145 },
  { id: '4', title_ar: 'DeFi والتمويل اللامركزي', title_en: 'DeFi & Decentralized Finance', category: 'crypto', duration_ar: '4 أسابيع', duration_en: '4 Weeks', price: 349, description_ar: 'اكتشف عالم التمويل اللامركزي، yield farming، وبروتوكولات الإقراض والاقتراض.', description_en: 'Explore DeFi world, yield farming, and lending/borrowing protocols.', level_ar: 'متوسط', level_en: 'Intermediate', sessions: 8, enrolled: 678 },
  { id: '5', title_ar: 'الاستثمار في الأسهم الأمريكية', title_en: 'US Stock Market Investing', category: 'stocks', duration_ar: '7 أسابيع', duration_en: '7 Weeks', price: 449, description_ar: 'تعلم تحليل أسهم الشركات الأمريكية الكبرى مثل Apple و Tesla واستراتيجيات بناء محفظة متنوعة.', description_en: 'Learn to analyze US blue-chip stocks like Apple & Tesla and build a diversified portfolio.', level_ar: 'متوسط', level_en: 'Intermediate', sessions: 14, enrolled: 1567 },
  { id: '6', title_ar: 'إدارة المخاطر في التداول', title_en: 'Trading Risk Management', category: 'forex', duration_ar: '4 أسابيع', duration_en: '4 Weeks', price: 249, description_ar: 'استراتيجيات حماية رأس المال، وقف الخسارة، وتحديد حجم الصفقة المناسب.', description_en: 'Capital protection strategies, stop-loss, and proper position sizing.', level_ar: 'متوسط', level_en: 'Intermediate', sessions: 8, enrolled: 923 },
  { id: '7', title_ar: 'تداول العقود الآجلة', title_en: 'Futures Trading', category: 'stocks', duration_ar: '6 أسابيع', duration_en: '6 Weeks', price: 549, description_ar: 'تعلم تداول العقود الآجلة للسلع والمؤشرات مع استراتيجيات التحوط المتقدمة.', description_en: 'Learn futures trading for commodities and indices with advanced hedging strategies.', level_ar: 'متقدم', level_en: 'Advanced', sessions: 12, enrolled: 432 },
  { id: '8', title_ar: 'سيكولوجية التداول', title_en: 'Trading Psychology', category: 'forex', duration_ar: '3 أسابيع', duration_en: '3 Weeks', price: 199, description_ar: 'تعلم التحكم في مشاعرك أثناء التداول وبناء عقلية المتداول الناجح.', description_en: 'Learn to control emotions while trading and build a successful trader mindset.', level_ar: 'مبتدئ', level_en: 'Beginner', sessions: 6, enrolled: 1876 },
  { id: '9', title_ar: 'NFT والرموز غير القابلة للاستبدال', title_en: 'NFTs & Digital Assets', category: 'crypto', duration_ar: '3 أسابيع', duration_en: '3 Weeks', price: 279, description_ar: 'فهم سوق NFT وكيفية تقييم وتداول الأصول الرقمية.', description_en: 'Understand the NFT market and how to evaluate and trade digital assets.', level_ar: 'مبتدئ', level_en: 'Beginner', sessions: 6, enrolled: 534 },
  { id: '10', title_ar: 'تداول الخيارات Options', title_en: 'Options Trading', category: 'stocks', duration_ar: '8 أسابيع', duration_en: '8 Weeks', price: 599, description_ar: 'استراتيجيات تداول الخيارات من Call و Put إلى Spread والاستراتيجيات المعقدة.', description_en: 'Options strategies from Calls & Puts to Spreads and complex strategies.', level_ar: 'متقدم', level_en: 'Advanced', sessions: 16, enrolled: 345 },
];

export const mockBlogPosts = [
  { id: '1', title_ar: 'توقعات الدولار الأمريكي أمام اليورو لعام 2024', title_en: 'USD/EUR Forecast for 2024', category: 'forex', author_ar: 'م. سعد الجواد', author_en: 'Eng. Saad AlJawad', date: '2024-12-15', readTime: 8, excerpt_ar: 'تحليل شامل لتحركات زوج EUR/USD مع توقعات الربع الأول بناءً على السياسات النقدية للفيدرالي الأمريكي والبنك المركزي الأوروبي.', excerpt_en: 'Comprehensive analysis of EUR/USD movements with Q1 forecasts based on Fed and ECB monetary policies.', content_ar: 'يشهد زوج اليورو/دولار تقلبات ملحوظة في ظل التغيرات في السياسات النقدية. مع توقعات بخفض أسعار الفائدة من قبل الفيدرالي الأمريكي في 2024، من المتوقع أن يضعف الدولار نسبياً أمام اليورو.\n\nالتحليل الفني يشير إلى مستوى دعم قوي عند 1.0650 ومقاومة عند 1.1200. المتوسط المتحرك 200 يوم يؤكد الاتجاه الصعودي على المدى المتوسط.\n\nنوصي بمراقبة بيانات التضخم الأمريكية والأوروبية عن كثب لتحديد نقاط الدخول المناسبة.', content_en: 'The EUR/USD pair is experiencing notable volatility amid changes in monetary policies. With expectations of Fed rate cuts in 2024, the dollar is expected to weaken relatively against the euro.\n\nTechnical analysis points to strong support at 1.0650 and resistance at 1.1200. The 200-day moving average confirms the medium-term bullish trend.\n\nWe recommend closely monitoring US and European inflation data to identify suitable entry points.', image: 'forex' },
  { id: '2', title_ar: 'بيتكوين يتجاوز 100 ألف: ماذا بعد؟', title_en: 'Bitcoin Breaks $100K: What\'s Next?', category: 'crypto', author_ar: 'أ. نور العلي', author_en: 'Ms. Noor Al-Ali', date: '2024-12-10', readTime: 6, excerpt_ar: 'بعد اختراق البيتكوين لحاجز 100 ألف دولار، نحلل السيناريوهات المحتملة والمستويات الفنية الرئيسية.', excerpt_en: 'After Bitcoin broke the $100K barrier, we analyze possible scenarios and key technical levels.', content_ar: 'حقق البيتكوين إنجازاً تاريخياً بتجاوز حاجز 100 ألف دولار. هذا الاختراق جاء مدعوماً بموافقة صناديق ETF والاهتمام المؤسسي المتزايد.\n\nالمستويات الفنية تشير إلى أهداف سعرية عند 120 ألف و 150 ألف دولار. ومع ذلك، لا يمكن استبعاد تصحيح نحو 85 ألف دولار.\n\nننصح بإدارة المخاطر بعناية وعدم الدخول بكامل رأس المال دفعة واحدة.', content_en: 'Bitcoin achieved a historic milestone by breaking the $100K barrier. This breakout was supported by ETF approvals and growing institutional interest.\n\nTechnical levels point to price targets at $120K and $150K. However, a correction towards $85K cannot be ruled out.\n\nWe advise careful risk management and not entering with full capital at once.', image: 'crypto' },
  { id: '3', title_ar: 'أفضل 5 أسهم تقنية للاستثمار في 2025', title_en: 'Top 5 Tech Stocks to Invest in 2025', category: 'stocks', author_ar: 'د. فهد القحطاني', author_en: 'Dr. Fahad Al-Qahtani', date: '2024-12-05', readTime: 10, excerpt_ar: 'تحليل مفصل لأفضل الأسهم التقنية التي تستحق الاستثمار فيها خلال 2025 بناءً على الأساسيات والنمو المتوقع.', excerpt_en: 'Detailed analysis of the best tech stocks worth investing in during 2025 based on fundamentals and expected growth.', content_ar: 'مع استمرار ثورة الذكاء الاصطناعي، تبقى أسهم التقنية من أفضل الفرص الاستثمارية. نستعرض هنا أفضل 5 أسهم:\n\n1. NVIDIA - المستفيد الأكبر من طفرة AI\n2. Microsoft - استثمارات ضخمة في Azure و OpenAI\n3. Apple - النظام البيئي الأقوى\n4. Amazon - AWS و التجارة الإلكترونية\n5. Tesla - السيارات الكهربائية والطاقة\n\nكل سهم يتم تحليله من حيث P/E ratio والنمو المتوقع وإمكانية التوزيعات.', content_en: 'With the AI revolution continuing, tech stocks remain among the best investment opportunities. Here are our top 5:\n\n1. NVIDIA - Biggest AI boom beneficiary\n2. Microsoft - Massive Azure & OpenAI investments\n3. Apple - Strongest ecosystem\n4. Amazon - AWS & e-commerce\n5. Tesla - EVs and energy\n\nEach stock is analyzed for P/E ratio, expected growth, and dividend potential.', image: 'stocks' },
  { id: '4', title_ar: 'استراتيجية السكالبينج: دليل المبتدئين', title_en: 'Scalping Strategy: Beginner\'s Guide', category: 'forex', author_ar: 'م. سعد الجواد', author_en: 'Eng. Saad AlJawad', date: '2024-11-28', readTime: 7, excerpt_ar: 'تعلم استراتيجية السكالبينج في الفوركس وكيفية تحقيق أرباح سريعة من الحركات الصغيرة في السوق.', excerpt_en: 'Learn the scalping strategy in Forex and how to profit from small market movements.', content_ar: 'السكالبينج هو أسلوب تداول يعتمد على فتح وإغلاق صفقات سريعة خلال دقائق معدودة. يتطلب هذا الأسلوب تركيزاً عالياً وتنفيذاً سريعاً.\n\nأفضل الأوقات للسكالبينج هي خلال تداخل الجلسات الأوروبية والأمريكية.\n\nالأزواج المفضلة: EUR/USD, GBP/USD, USD/JPY', content_en: 'Scalping is a trading style that relies on opening and closing quick trades within minutes. This style requires high focus and fast execution.\n\nBest times for scalping are during European-American session overlaps.\n\nPreferred pairs: EUR/USD, GBP/USD, USD/JPY', image: 'forex' },
  { id: '5', title_ar: 'إيثريوم 2.0: التحول الكبير', title_en: 'Ethereum 2.0: The Big Shift', category: 'crypto', author_ar: 'أ. نور العلي', author_en: 'Ms. Noor Al-Ali', date: '2024-11-20', readTime: 9, excerpt_ar: 'كيف يغير انتقال إيثريوم إلى إثبات الحصة مستقبل العملات الرقمية والتمويل اللامركزي.', excerpt_en: 'How Ethereum\'s transition to Proof of Stake is changing the future of crypto and DeFi.', content_ar: 'يمثل انتقال إيثريوم إلى آلية إثبات الحصة (PoS) نقلة نوعية في عالم البلوكتشين. هذا التحول يقلل استهلاك الطاقة بنسبة 99% ويزيد قابلية التوسع.\n\nمن المتوقع أن يؤدي هذا إلى زيادة تبني DeFi وارتفاع قيمة ETH على المدى الطويل.', content_en: 'Ethereum\'s transition to Proof of Stake (PoS) represents a quantum leap in blockchain. This shift reduces energy consumption by 99% and increases scalability.\n\nThis is expected to boost DeFi adoption and increase ETH value long-term.', image: 'crypto' },
  { id: '6', title_ar: 'كيف تقرأ تقرير أرباح الشركات', title_en: 'How to Read Earnings Reports', category: 'stocks', author_ar: 'د. فهد القحطاني', author_en: 'Dr. Fahad Al-Qahtani', date: '2024-11-15', readTime: 12, excerpt_ar: 'دليل شامل لفهم تقارير الأرباح الفصلية وكيفية استخدامها في قرارات الاستثمار.', excerpt_en: 'Complete guide to understanding quarterly earnings reports and using them for investment decisions.', content_ar: 'تقارير الأرباح الفصلية هي من أهم العوامل المؤثرة على أسعار الأسهم. يجب فهم المقاييس الرئيسية مثل:\n\n- EPS (ربحية السهم)\n- Revenue (الإيرادات)\n- Guidance (التوجيهات المستقبلية)\n- Margins (هوامش الربح)\n\nالمفاجآت الإيجابية عادة تؤدي لارتفاع السهم 5-15% في يوم الإعلان.', content_en: 'Quarterly earnings reports are among the most important factors affecting stock prices. Key metrics to understand:\n\n- EPS (Earnings Per Share)\n- Revenue\n- Guidance (Future outlook)\n- Margins\n\nPositive surprises usually lead to 5-15% stock increase on announcement day.', image: 'stocks' },
];

export const mockUsers = [
  { id: '1', name_ar: 'أحمد محمد العلي', name_en: 'Ahmed Al-Ali', email: 'ahmed@example.com', phone: '+971501234567', role: 'user', status: 'active', joinDate: '2024-01-15', tags: ['VIP'], notes: '' },
  { id: '2', name_ar: 'فاطمة حسن', name_en: 'Fatima Hassan', email: 'fatima@example.com', phone: '+971507654321', role: 'user', status: 'active', joinDate: '2024-02-20', tags: [], notes: '' },
  { id: '3', name_ar: 'عمر خالد السعيد', name_en: 'Omar Al-Saeed', email: 'omar@example.com', phone: '+971509876543', role: 'user', status: 'inactive', joinDate: '2024-03-10', tags: ['lead'], notes: '' },
  { id: '4', name_ar: 'نورة عبدالله', name_en: 'Noura Abdullah', email: 'noura@example.com', phone: '+971502345678', role: 'user', status: 'active', joinDate: '2024-01-25', tags: ['VIP', 'returning'], notes: '' },
  { id: '5', name_ar: 'خالد إبراهيم', name_en: 'Khaled Ibrahim', email: 'khaled@example.com', phone: '+971503456789', role: 'user', status: 'active', joinDate: '2024-04-05', tags: [], notes: '' },
  { id: '6', name_ar: 'سارة يوسف', name_en: 'Sara Youssef', email: 'sara@example.com', phone: '+971504567890', role: 'user', status: 'pending', joinDate: '2024-05-12', tags: ['lead'], notes: '' },
  { id: '7', name_ar: 'محمد عبدالرحمن', name_en: 'Mohammed Abdulrahman', email: 'moh@example.com', phone: '+971505678901', role: 'admin', status: 'active', joinDate: '2023-06-01', tags: ['admin'], notes: '' },
  { id: '8', name_ar: 'ليلى أحمد', name_en: 'Layla Ahmed', email: 'layla@example.com', phone: '+971506789012', role: 'user', status: 'active', joinDate: '2024-06-18', tags: [], notes: '' },
];

export const mockApplications = [
  { id: '1', userId: '1', courseId: '1', status: 'approved', appliedAt: '2024-02-01T10:30:00', notes: 'متداول ذو خبرة' },
  { id: '2', userId: '2', courseId: '3', status: 'under_review', appliedAt: '2024-03-15T14:00:00', notes: '' },
  { id: '3', userId: '3', courseId: '5', status: 'submitted', appliedAt: '2024-04-20T09:15:00', notes: '' },
  { id: '4', userId: '4', courseId: '2', status: 'approved', appliedAt: '2024-01-28T11:00:00', notes: 'متداول عائد' },
  { id: '5', userId: '5', courseId: '4', status: 'rejected', appliedAt: '2024-05-01T16:30:00', notes: 'لم يستوفِ الشروط' },
  { id: '6', userId: '1', courseId: '7', status: 'scheduled', appliedAt: '2024-05-10T08:00:00', notes: '' },
  { id: '7', userId: '6', courseId: '1', status: 'draft', appliedAt: '2024-06-01T13:45:00', notes: '' },
  { id: '8', userId: '2', courseId: '9', status: 'completed', appliedAt: '2024-01-05T10:00:00', notes: 'أنهى الدورة بنجاح' },
];

export const mockCampaigns = [
  { id: '1', name_ar: 'حملة إطلاق منصة التداول', name_en: 'Trading Platform Launch', status: 'active', budget: 25000, spent: 14500, leads: 534, conversions: 89, startDate: '2024-06-01', endDate: '2024-08-31' },
  { id: '2', name_ar: 'دورة التحليل الفني المجانية', name_en: 'Free TA Course Campaign', status: 'completed', budget: 8000, spent: 7800, leads: 1256, conversions: 432, startDate: '2024-03-01', endDate: '2024-04-15' },
  { id: '3', name_ar: 'حملة رمضان للتداول', name_en: 'Ramadan Trading Campaign', status: 'draft', budget: 30000, spent: 0, leads: 0, conversions: 0, startDate: '2025-02-28', endDate: '2025-03-30' },
  { id: '4', name_ar: 'برنامج إحالة المتداولين', name_en: 'Trader Referral Program', status: 'active', budget: 10000, spent: 6200, leads: 289, conversions: 128, startDate: '2024-01-01', endDate: '2024-12-31' },
];

export const mockTransactions = [
  { id: '1', userId: '1', amount: 299, type: 'payment', status: 'completed', date: '2024-02-05T10:00:00', description_ar: 'رسوم دورة أساسيات الفوركس', description_en: 'Forex Fundamentals fee', invoiceNo: 'INV-2024-001' },
  { id: '2', userId: '4', amount: 499, type: 'payment', status: 'completed', date: '2024-02-01T14:30:00', description_ar: 'رسوم دورة التحليل الفني', description_en: 'Technical Analysis fee', invoiceNo: 'INV-2024-002' },
  { id: '3', userId: '2', amount: 399, type: 'payment', status: 'pending', date: '2024-03-20T09:00:00', description_ar: 'رسوم دورة العملات الرقمية', description_en: 'Crypto Trading fee', invoiceNo: 'INV-2024-003' },
  { id: '4', userId: '1', amount: 100, type: 'refund', status: 'completed', date: '2024-04-10T11:15:00', description_ar: 'استرداد جزئي', description_en: 'Partial refund', invoiceNo: 'INV-2024-004' },
  { id: '5', userId: '5', amount: 349, type: 'payment', status: 'failed', date: '2024-05-05T16:00:00', description_ar: 'رسوم دورة DeFi', description_en: 'DeFi course fee', invoiceNo: 'INV-2024-005' },
];

export const mockSessions = [
  { id: '1', courseId: '1', title_ar: 'مقدمة في سوق الفوركس', title_en: 'Intro to Forex Market', date: '2024-07-15', time: '18:00', duration: 90, instructor_ar: 'م. سعد الجواد', instructor_en: 'Eng. Saad AlJawad', attendees: ['1', '4'] },
  { id: '2', courseId: '1', title_ar: 'أزواج العملات الرئيسية', title_en: 'Major Currency Pairs', date: '2024-07-17', time: '18:00', duration: 90, instructor_ar: 'م. سعد الجواد', instructor_en: 'Eng. Saad AlJawad', attendees: ['1', '4'] },
  { id: '3', courseId: '2', title_ar: 'قراءة الشموع اليابانية', title_en: 'Reading Candlesticks', date: '2024-07-16', time: '20:00', duration: 120, instructor_ar: 'أ. سعود العتيبي', instructor_en: 'Mr. Saud Al-Otaibi', attendees: ['4'] },
  { id: '4', courseId: '3', title_ar: 'أساسيات البلوكتشين', title_en: 'Blockchain Fundamentals', date: '2024-07-18', time: '19:00', duration: 90, instructor_ar: 'أ. نور العلي', instructor_en: 'Ms. Noor Al-Ali', attendees: ['2'] },
];

export const mockTestimonials = [
  { id: '1', name_ar: 'عبدالله الراشد', name_en: 'Abdullah Al-Rashed', role_ar: 'متداول فوركس', role_en: 'Forex Trader', text_ar: 'بفضل الجواد للتداول، حققت أرباحاً شهرية ثابتة بنسبة 12%. الإشارات دقيقة والدعم ممتاز.', text_en: 'Thanks to AlJawad Trading, I achieved consistent 12% monthly profits. Signals are accurate and support is excellent.' },
  { id: '2', name_ar: 'مريم الهاشمي', name_en: 'Mariam Al-Hashimi', role_ar: 'مستثمرة كريبتو', role_en: 'Crypto Investor', text_ar: 'دورة العملات الرقمية غيّرت فهمي لسوق الكريبتو بالكامل. محتوى احترافي ومدربون خبراء.', text_en: 'The crypto course completely changed my understanding of the market. Professional content and expert trainers.' },
  { id: '3', name_ar: 'يوسف المنصور', name_en: 'Youssef Al-Mansour', role_ar: 'مستثمر أسهم', role_en: 'Stock Investor', text_ar: 'منصة رائعة لتداول الأسهم. الأدوات التحليلية متقدمة جداً وسهلة الاستخدام في نفس الوقت.', text_en: 'Great platform for stock trading. Analytical tools are very advanced yet easy to use.' },
  { id: '4', name_ar: 'هند العمري', name_en: 'Hind Al-Omari', role_ar: 'متداولة يومية', role_en: 'Day Trader', text_ar: 'التنفيذ السريع والسبريد المنخفض جعلا تداول السكالبينج مربحاً جداً. أنصح بشدة.', text_en: 'Fast execution and low spreads made scalping very profitable. Highly recommended.' },
];

export const mockNotifications = [
  { id: '1', title_ar: 'إشارة تداول: شراء EUR/USD', title_en: 'Trade Signal: Buy EUR/USD', message_ar: 'إشارة شراء على EUR/USD عند 1.0850 - هدف 1.0920 - وقف 1.0810', message_en: 'Buy signal on EUR/USD at 1.0850 - Target 1.0920 - Stop 1.0810', date: '2024-06-20T10:00:00', read: false, type: 'success' },
  { id: '2', title_ar: 'تنبيه سوق', title_en: 'Market Alert', message_ar: 'البيتكوين يقترب من مستوى مقاومة رئيسي عند 105,000$', message_en: 'Bitcoin approaching key resistance level at $105,000', date: '2024-07-14T15:00:00', read: false, type: 'info' },
  { id: '3', title_ar: 'دورة جديدة', title_en: 'New Course', message_ar: 'تم إضافة دورة جديدة: تداول الخيارات المتقدم', message_en: 'New course added: Advanced Options Trading', date: '2024-07-10T09:00:00', read: true, type: 'info' },
  { id: '4', title_ar: 'تحديث الحساب', title_en: 'Account Update', message_ar: 'يرجى تحديث بيانات التحقق الخاصة بك', message_en: 'Please update your verification documents', date: '2024-07-05T12:00:00', read: true, type: 'warning' },
];

export const mockMarketData = [
  { symbol: 'EUR/USD', price: 1.0856, change: +0.32, category: 'forex' },
  { symbol: 'GBP/USD', price: 1.2734, change: -0.15, category: 'forex' },
  { symbol: 'USD/JPY', price: 149.82, change: +0.45, category: 'forex' },
  { symbol: 'BTC/USD', price: 104523, change: +2.14, category: 'crypto' },
  { symbol: 'ETH/USD', price: 3856, change: +1.87, category: 'crypto' },
  { symbol: 'SOL/USD', price: 187.45, change: -3.21, category: 'crypto' },
  { symbol: 'AAPL', price: 198.45, change: +0.82, category: 'stocks' },
  { symbol: 'TSLA', price: 256.78, change: -1.24, category: 'stocks' },
  { symbol: 'NVDA', price: 875.32, change: +3.45, category: 'stocks' },
];

export const statusLabels = {
  draft: { ar: 'مسودة', en: 'Draft' },
  submitted: { ar: 'مقدم', en: 'Submitted' },
  under_review: { ar: 'قيد المراجعة', en: 'Under Review' },
  approved: { ar: 'مقبول', en: 'Approved' },
  rejected: { ar: 'مرفوض', en: 'Rejected' },
  scheduled: { ar: 'مجدول', en: 'Scheduled' },
  completed: { ar: 'مكتمل', en: 'Completed' },
  active: { ar: 'نشط', en: 'Active' },
  inactive: { ar: 'غير نشط', en: 'Inactive' },
  pending: { ar: 'معلق', en: 'Pending' },
  failed: { ar: 'فشل', en: 'Failed' },
  payment: { ar: 'دفع', en: 'Payment' },
  refund: { ar: 'استرداد', en: 'Refund' },
};
