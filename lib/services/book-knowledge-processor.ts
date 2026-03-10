// Book Knowledge Processor - Ingesting Complete Trading Books
// Processing entire books and storing knowledge for AI decision enhancement

export interface BookContent {
  book_id: string;
  title: string;
  author: string;
  publication_year: number;
  category: 'PRICE_ACTION' | 'PSYCHOLOGY' | 'RISK_MANAGEMENT' | 'TECHNICAL_ANALYSIS' | 'OPTIONS' | 'MARKET_STRUCTURE';
  total_pages: number;
  processing_status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  processed_date: string;
}

export interface ExtractedKnowledge {
  knowledge_id: string;
  book_id: string;
  chapter: string;
  page_range: string;
  concept_category: string;
  key_concept: string;
  detailed_explanation: string;
  practical_applications: string[];
  validation_rules: string[];
  market_examples: string[];
  integration_points: string[];
  relevance_score: number; // 0-100 how relevant to our system
  implementation_priority: 'HIGH' | 'MEDIUM' | 'LOW';
  extracted_at: string;
}

export interface KnowledgeIndex {
  concept_index: Map<string, ExtractedKnowledge[]>;
  category_index: Map<string, ExtractedKnowledge[]>;
  book_index: Map<string, ExtractedKnowledge[]>;
  pattern_index: Map<string, ExtractedKnowledge[]>;
  search_index: Map<string, string[]>; // For fast text search
}

export interface BookProcessingConfig {
  extraction_rules: {
    focus_keywords: string[];
    skip_patterns: string[];
    concept_identifiers: string[];
    example_patterns: string[];
  };
  storage_rules: {
    min_relevance_score: number;
    max_concepts_per_page: number;
    duplicate_threshold: number;
  };
  integration_rules: {
    system_alignment_threshold: number;
    implementation_priority_rules: string[];
  };
}

export class BookKnowledgeProcessor {
  private knowledgeIndex: KnowledgeIndex;
  private processedBooks: Map<string, BookContent> = new Map();
  private extractedKnowledge: Map<string, ExtractedKnowledge> = new Map();
  
  constructor() {
    this.knowledgeIndex = {
      concept_index: new Map(),
      category_index: new Map(),
      book_index: new Map(),
      pattern_index: new Map(),
      search_index: new Map()
    };
    this.initializeBookProcessor();
  }

  private initializeBookProcessor(): void {
    console.log('📚 INITIALIZING BOOK KNOWLEDGE PROCESSOR');
    console.log('📖 Ready to process complete trading books...');
    console.log('🗃️ Knowledge storage and indexing system active...');
    console.log('🔍 Smart extraction and integration ready...');
    console.log('📚 Book Processor ONLINE');
  }

  /**
   * Main method to process an entire book
   */
  async processCompleteBook(
    bookFile: string, // PDF, EPUB, or text file
    bookMetadata: Omit<BookContent, 'book_id' | 'processing_status' | 'processed_date'>
  ): Promise<{
    book_id: string;
    processing_summary: ProcessingSummary;
    extracted_concepts: number;
    integration_quality: number;
  }> {
    
    const bookId = this.generateBookId(bookMetadata.title, bookMetadata.author);
    
    console.log(`📚 PROCESSING COMPLETE BOOK: ${bookMetadata.title}`);
    console.log(`📖 Author: ${bookMetadata.author}`);
    console.log(`📊 Category: ${bookMetadata.category}`);
    
    // Step 1: Parse the book content
    const parsedContent = await this.parseBookContent(bookFile);
    
    // Step 2: Extract trading knowledge
    const extractedKnowledge = await this.extractTradingKnowledge(
      parsedContent, 
      bookId, 
      bookMetadata.category
    );
    
    // Step 3: Process and validate knowledge
    const processedKnowledge = await this.processAndValidateKnowledge(
      extractedKnowledge,
      bookMetadata.category
    );
    
    // Step 4: Store in knowledge base
    await this.storeInKnowledgeBase(processedKnowledge, bookId);
    
    // Step 5: Create searchable indexes
    this.buildSearchIndexes(processedKnowledge, bookId);
    
    // Step 6: Integration quality assessment
    const integrationQuality = this.assessIntegrationQuality(
      processedKnowledge,
      bookMetadata.category
    );
    
    const processingSummary: ProcessingSummary = {
      total_pages_processed: parsedContent.page_count,
      concepts_extracted: processedKnowledge.length,
      high_priority_concepts: processedKnowledge.filter(k => k.implementation_priority === 'HIGH').length,
      system_aligned_concepts: processedKnowledge.filter(k => k.relevance_score > 80).length,
      processing_time: new Date().toISOString()
    };

    return {
      book_id: bookId,
      processing_summary: processingSummary,
      extracted_concepts: processedKnowledge.length,
      integration_quality: integrationQuality
    };
  }

  /**
   * Pre-configured book processing for specific expert books
   */
  async processExpertTradingBooks(): Promise<{
    anna_coulling_vpa: any;
    john_carter_mastering: any;
  }> {
    console.log('📚 PROCESSING EXPERT TRADING BOOKS');
    console.log('📖 Anna Coulling - Volume Price Analysis');
    console.log('📖 John Carter - Mastering the Trade (3rd Edition)');
    
    // Process Anna Coulling's Volume Price Analysis
    const annaCoullingResult = await this.processCompleteBook(
      "anna_coulling_volume_price_analysis.pdf",
      {
        title: "A Complete Guide to Volume Price Analysis",
        author: "Anna Coulling",
        publication_year: 2013,
        category: 'TECHNICAL_ANALYSIS',
        total_pages: 400
      }
    );
    
    // Process John Carter's Mastering the Trade
    const johnCarterResult = await this.processCompleteBook(
      "john_carter_mastering_the_trade_3rd.pdf", 
      {
        title: "Mastering the Trade, Third Edition",
        author: "John Carter",
        publication_year: 2019,
        category: 'TECHNICAL_ANALYSIS',
        total_pages: 350
      }
    );
    
    return {
      anna_coulling_vpa: annaCoullingResult,
      john_carter_mastering: johnCarterResult
    };
  }

  /**
   * Enhanced knowledge extraction for Anna Coulling's VPA concepts
   */
  private async extractAnnaCoullingVPAConcepts(
    parsedContent: ParsedContent,
    bookId: string
  ): Promise<RawKnowledgeExtract[]> {
    console.log('📊 Extracting Anna Coulling VPA Knowledge...');
    
    const vpaExtracts: RawKnowledgeExtract[] = [];
    
    // Anna Coulling's core VPA concepts
    const vpaKeywords = [
      'volume price analysis', 'price volume relationship', 'volume validation',
      'accumulation', 'distribution', 'buying pressure', 'selling pressure',
      'volume climax', 'volume exhaustion', 'volume confirmation',
      'institutional volume', 'smart money volume', 'retail volume',
      'volume patterns', 'volume divergence', 'volume breakout',
      'volume at price', 'volume profile', 'volume weighted average price',
      'effort vs result', 'cause and effect', 'volume spread analysis',
      'up volume', 'down volume', 'volume expansion', 'volume contraction'
    ];
    
    for (const chapter of parsedContent.chapters) {
      for (const keyword of vpaKeywords) {
        if (chapter.content.toLowerCase().includes(keyword)) {
          vpaExtracts.push({
            raw_id: this.generateRawId(),
            book_id: bookId,
            chapter: chapter.title,
            page_range: chapter.pages,
            raw_text: this.extractVPAContext(chapter.content, keyword),
            identified_concept: keyword,
            context: this.getVPAContext(chapter.content, keyword),
            confidence_score: 0.9 // High confidence for VPA concepts
          });
        }
      }
    }
    
    return vpaExtracts;
  }

  /**
   * Enhanced knowledge extraction for John Carter's trading concepts
   */
  private async extractJohnCarterTradingConcepts(
    parsedContent: ParsedContent,
    bookId: string
  ): Promise<RawKnowledgeExtract[]> {
    console.log('⚡ Extracting John Carter Trading Knowledge...');
    
    const carterExtracts: RawKnowledgeExtract[] = [];
    
    // John Carter's core trading concepts
    const carterKeywords = [
      'scalping', 'swing trading', 'momentum trading', 'gap trading',
      'pre market analysis', 'opening range breakout', 'fibonacci retracements',
      'moving average confluence', 'support resistance levels', 'trend analysis',
      'risk management', 'position sizing', 'trade management', 'entry strategies',
      'exit strategies', 'stop placement', 'profit targets', 'trade psychology',
      'market timing', 'sector analysis', 'relative strength', 'market internals',
      'volume analysis', 'price action', 'chart patterns', 'breakout trading',
      'pullback trading', 'reversal patterns', 'continuation patterns',
      'trading plan', 'trading rules', 'money management', 'performance tracking'
    ];
    
    for (const chapter of parsedContent.chapters) {
      for (const keyword of carterKeywords) {
        if (chapter.content.toLowerCase().includes(keyword)) {
          carterExtracts.push({
            raw_id: this.generateRawId(),
            book_id: bookId,
            chapter: chapter.title,
            page_range: chapter.pages,
            raw_text: this.extractCarterContext(chapter.content, keyword),
            identified_concept: keyword,
            context: this.getCarterContext(chapter.content, keyword),
            confidence_score: 0.85 // High confidence for Carter concepts
          });
        }
      }
    }
    
    return carterExtracts;
  }

  /**
   * Simulate Anna Coulling VPA knowledge extraction
   */
  private simulateAnnaCoullingVPAKnowledge(): ExtractedKnowledge[] {
    return [
      {
        knowledge_id: this.generateKnowledgeId(),
        book_id: "book_volume_price_analysis_anna_coulling",
        chapter: "Understanding Volume and Price Relationships",
        page_range: "45-67",
        concept_category: "VOLUME_ANALYSIS",
        key_concept: "volume_price_validation",
        detailed_explanation: "Volume should validate price movement. When price moves higher on increasing volume, it confirms buying pressure. When price moves higher on decreasing volume, it suggests weakness and potential reversal.",
        practical_applications: [
          "Validate breakouts with volume expansion",
          "Identify weak rallies with declining volume",
          "Confirm reversals with volume climax patterns",
          "Use volume to distinguish between institutional and retail activity"
        ],
        validation_rules: [
          "Rising prices + rising volume = healthy trend",
          "Rising prices + falling volume = potential weakness",
          "Falling prices + rising volume = strong selling pressure",
          "Volume climax often marks trend exhaustion"
        ],
        market_examples: [
          "AAPL breakout above $150 with 3x average volume confirms institutional buying",
          "SPY rally on declining volume warns of potential pullback",
          "Volume exhaustion at major resistance suggests reversal opportunity"
        ],
        integration_points: [
          "Enhances our volume pillar with VPA principles",
          "Validates momentum signals with volume confirmation",
          "Strengthens breakout analysis with volume validation",
          "Improves institutional vs retail flow detection"
        ],
        relevance_score: 98,
        implementation_priority: 'HIGH',
        extracted_at: new Date().toISOString()
      },
      {
        knowledge_id: this.generateKnowledgeId(),
        book_id: "book_volume_price_analysis_anna_coulling",
        chapter: "Accumulation and Distribution Patterns",
        page_range: "125-145",
        concept_category: "INSTITUTIONAL_ANALYSIS",
        key_concept: "smart_money_accumulation",
        detailed_explanation: "Smart money accumulates positions gradually over time, creating volume patterns that show institutional interest. Look for consistent buying on any weakness and volume expansion on small price moves up.",
        practical_applications: [
          "Identify accumulation zones for entry opportunities",
          "Spot distribution patterns for exit signals", 
          "Track institutional footprints through volume analysis",
          "Time entries during accumulation phases"
        ],
        validation_rules: [
          "Accumulation shows volume on down moves, price holds support",
          "Distribution shows volume on up moves, price fails at resistance",
          "Volume patterns precede price movements by 1-3 periods",
          "Smart money activity creates volume anomalies vs retail patterns"
        ],
        market_examples: [
          "NVDA accumulation at $400 level over 2 weeks before breakout",
          "SPY distribution pattern at 4200 resistance before decline",
          "Volume on dips + price holding = accumulation signal"
        ],
        integration_points: [
          "Directly enhances our Smart Money Detection engine",
          "Validates our institutional manipulation detection",
          "Strengthens our volume pillar with accumulation/distribution logic",
          "Improves our key level analysis with volume context"
        ],
        relevance_score: 96,
        implementation_priority: 'HIGH',
        extracted_at: new Date().toISOString()
      }
    ];
  }

  /**
   * Simulate John Carter trading knowledge extraction
   */
  private simulateJohnCarterTradingKnowledge(): ExtractedKnowledge[] {
    return [
      {
        knowledge_id: this.generateKnowledgeId(),
        book_id: "book_mastering_trade_john_carter",
        chapter: "Opening Range Breakout Strategy",
        page_range: "78-95",
        concept_category: "BREAKOUT_STRATEGY",
        key_concept: "opening_range_breakout",
        detailed_explanation: "The first 30 minutes of trading establishes the opening range. Breakouts from this range with volume often lead to significant moves throughout the day. Focus on stocks with pre-market catalysts and tight opening ranges.",
        practical_applications: [
          "Trade breakouts from 30-minute opening range",
          "Use tight stops below/above opening range",
          "Target 2-3x opening range for profit taking",
          "Focus on stocks with news catalysts"
        ],
        validation_rules: [
          "Opening range should be tight (less than 2% of stock price)",
          "Volume on breakout should exceed 150% of average",
          "Pre-market volume and news catalysts increase success rate",
          "Best results in first 2 hours of trading"
        ],
        market_examples: [
          "TSLA earnings day: $10 opening range, breakout to $35 move",
          "SPY tight range first 30min, breakout leads to trending day",
          "Biotech catalyst: $2 range breaks to $8 move on volume"
        ],
        integration_points: [
          "Enhances our breakout analysis with time-based component",
          "Integrates with our volume pillar for breakout validation",
          "Supports our momentum cascade analysis",
          "Adds intraday timing to our key level system"
        ],
        relevance_score: 92,
        implementation_priority: 'HIGH',
        extracted_at: new Date().toISOString()
      },
      {
        knowledge_id: this.generateKnowledgeId(),
        book_id: "book_mastering_trade_john_carter",
        chapter: "Trade Management and Position Sizing",
        page_range: "200-225",
        concept_category: "RISK_MANAGEMENT",
        key_concept: "dynamic_position_sizing",
        detailed_explanation: "Position size should be based on volatility, account size, and setup quality. Use ATR for stop placement and risk 1-2% per trade. Scale into winners and out of losers. High probability setups get larger size.",
        practical_applications: [
          "Calculate position size based on ATR and account risk",
          "Scale into positions on confirmation",
          "Use trailing stops based on ATR multiples",
          "Increase size on high-probability confluence setups"
        ],
        validation_rules: [
          "Never risk more than 2% of account on single trade",
          "ATR-based stops should be 2-3x average true range",
          "High confluence setups (80%+ probability) can take 1.5x normal size",
          "Scale out 1/3 at first target, let runners work"
        ],
        market_examples: [
          "AAPL setup: 2 ATR stop = $8, risk $1000 = 125 shares max",
          "High confluence SPY setup: normal 100 shares becomes 150",
          "Scale out strategy: sell 1/3 at +1R, 1/3 at +2R, let 1/3 run"
        ],
        integration_points: [
          "Directly enhances our asymmetric strategy engine",
          "Integrates with our trade quality filter for sizing decisions",
          "Supports our foundation-first approach with confluence sizing",
          "Validates our 5-pillar system with higher size on alignment"
        ],
        relevance_score: 94,
        implementation_priority: 'HIGH',
        extracted_at: new Date().toISOString()
      },
      {
        knowledge_id: this.generateKnowledgeId(),
        book_id: "book_mastering_trade_john_carter",
        chapter: "Reading Market Internals",
        page_range: "156-175",
        concept_category: "MARKET_INTERNALS",
        key_concept: "advance_decline_analysis",
        detailed_explanation: "Market internals tell the real story of market strength or weakness. Watch advance/decline ratio, new highs/lows, and sector rotation. Strong markets show broad participation, weak markets show narrow leadership.",
        practical_applications: [
          "Use A/D line to confirm market direction",
          "Monitor new high/low ratio for market health",
          "Track sector rotation for strength identification",
          "Fade moves that lack internal confirmation"
        ],
        validation_rules: [
          "Healthy rallies show A/D ratio above 2:1",
          "New highs should exceed new lows by 3:1 in strong markets",
          "Sector rotation confirms sustainable moves",
          "Divergences between price and internals warn of reversals"
        ],
        market_examples: [
          "SPY new high with negative A/D warned of March 2022 top",
          "Strong internal confirmation supported 2023 rally",
          "Sector rotation from growth to value signaled regime change"
        ],
        integration_points: [
          "Enhances our market context analysis with internal metrics",
          "Validates our smart money detection with breadth analysis",
          "Supports our world intelligence with market regime detection",
          "Strengthens our foundation analysis with internal confirmation"
        ],
        relevance_score: 90,
        implementation_priority: 'HIGH',
        extracted_at: new Date().toISOString()
      }
    ];
  }

  /**
   * Parse book content from different file formats
   */
  private async parseBookContent(bookFile: string): Promise<ParsedContent> {
    console.log('📖 Parsing book content...');
    
    // This would integrate with PDF/EPUB parsers
    // For now, simulating the structure
    return {
      page_count: 350,
      chapters: [
        {
          chapter_number: 1,
          title: "Introduction to Price Action",
          content: "Price action is the movement of price over time...",
          pages: "1-25"
        },
        {
          chapter_number: 2,
          title: "Reading Candlestick Patterns",
          content: "Candlesticks tell the story of market psychology...",
          pages: "26-75"
        },
        {
          chapter_number: 3,
          title: "Support and Resistance",
          content: "Key levels act as battle zones where supply meets demand...",
          pages: "76-125"
        }
        // ... more chapters
      ],
      metadata: {
        total_words: 85000,
        key_terms_frequency: new Map([
          ['support', 145],
          ['resistance', 132],
          ['volume', 98],
          ['momentum', 76]
        ])
      }
    };
  }

  /**
   * Extract trading knowledge using NLP and pattern recognition
   */
  private async extractTradingKnowledge(
    parsedContent: ParsedContent,
    bookId: string,
    category: string
  ): Promise<RawKnowledgeExtract[]> {
    console.log('🔍 Extracting trading knowledge...');
    
    const extracts: RawKnowledgeExtract[] = [];
    
    for (const chapter of parsedContent.chapters) {
      // Use NLP to identify key concepts
      const concepts = await this.identifyTradingConcepts(chapter.content, category);
      
      for (const concept of concepts) {
        extracts.push({
          raw_id: this.generateRawId(),
          book_id: bookId,
          chapter: chapter.title,
          page_range: chapter.pages,
          raw_text: concept.text,
          identified_concept: concept.concept,
          context: concept.context,
          confidence_score: concept.confidence
        });
      }
    }
    
    return extracts;
  }

  /**
   * Process and validate extracted knowledge
   */
  private async processAndValidateKnowledge(
    rawExtracts: RawKnowledgeExtract[],
    category: string
  ): Promise<ExtractedKnowledge[]> {
    console.log('⚙️ Processing and validating knowledge...');
    
    const processedKnowledge: ExtractedKnowledge[] = [];
    
    for (const extract of rawExtracts) {
      // Only process high-confidence extracts
      if (extract.confidence_score < 0.7) continue;
      
      const processed = await this.processKnowledgeExtract(extract, category);
      
      // Validate against our system
      const systemAlignment = await this.validateSystemAlignment(processed);
      
      if (systemAlignment > 50) { // Only store relevant knowledge
        processed.relevance_score = systemAlignment;
        processedKnowledge.push(processed);
      }
    }
    
    return processedKnowledge;
  }

  /**
   * Store knowledge in searchable database
   */
  private async storeInKnowledgeBase(
    knowledge: ExtractedKnowledge[],
    bookId: string
  ): Promise<void> {
    console.log('🗃️ Storing in knowledge base...');
    
    for (const item of knowledge) {
      // Store in main knowledge map
      this.extractedKnowledge.set(item.knowledge_id, item);
      
      // Update concept index
      const conceptKey = item.key_concept.toLowerCase();
      if (!this.knowledgeIndex.concept_index.has(conceptKey)) {
        this.knowledgeIndex.concept_index.set(conceptKey, []);
      }
      this.knowledgeIndex.concept_index.get(conceptKey)!.push(item);
      
      // Update category index
      if (!this.knowledgeIndex.category_index.has(item.concept_category)) {
        this.knowledgeIndex.category_index.set(item.concept_category, []);
      }
      this.knowledgeIndex.category_index.get(item.concept_category)!.push(item);
      
      // Update book index
      if (!this.knowledgeIndex.book_index.has(bookId)) {
        this.knowledgeIndex.book_index.set(bookId, []);
      }
      this.knowledgeIndex.book_index.get(bookId)!.push(item);
    }
  }

  /**
   * Query knowledge base during trading decisions
   */
  async queryKnowledgeForDecision(
    marketContext: any,
    foundationAnalysis: any
  ): Promise<{
    relevant_knowledge: ExtractedKnowledge[];
    practical_applications: string[];
    validation_rules: string[];
    implementation_guidance: string[];
  }> {
    console.log('🔍 Querying knowledge base for decision support...');
    
    const relevantKnowledge: ExtractedKnowledge[] = [];
    const practicalApplications: string[] = [];
    const validationRules: string[] = [];
    const implementationGuidance: string[] = [];
    
    // Query based on current market conditions
    if (foundationAnalysis.price_action?.candle_type) {
      const candleKnowledge = this.queryByPattern(foundationAnalysis.price_action.candle_type);
      relevantKnowledge.push(...candleKnowledge);
    }
    
    if (foundationAnalysis.key_levels?.level_interaction) {
      const levelKnowledge = this.queryByConcept('support_resistance');
      relevantKnowledge.push(...levelKnowledge);
    }
    
    if (foundationAnalysis.momentum?.cascade_alignment) {
      const momentumKnowledge = this.queryByConcept('momentum_analysis');
      relevantKnowledge.push(...momentumKnowledge);
    }
    
    // Extract practical guidance
    for (const knowledge of relevantKnowledge) {
      practicalApplications.push(...knowledge.practical_applications);
      validationRules.push(...knowledge.validation_rules);
      implementationGuidance.push(...knowledge.integration_points);
    }
    
    return {
      relevant_knowledge: this.deduplicate(relevantKnowledge),
      practical_applications: this.deduplicate(practicalApplications),
      validation_rules: this.deduplicate(validationRules),
      implementation_guidance: this.deduplicate(implementationGuidance)
    };
  }

  /**
   * Helper methods for knowledge extraction
   */
  private async identifyTradingConcepts(
    text: string,
    category: string
  ): Promise<IdentifiedConcept[]> {
    // This would use NLP libraries like spaCy, NLTK, or transformers
    // For now, simulating concept identification
    const concepts: IdentifiedConcept[] = [];
    
    const tradingKeywords = {
      'PRICE_ACTION': ['candlestick', 'engulfing', 'doji', 'hammer', 'shooting star'],
      'TECHNICAL_ANALYSIS': ['support', 'resistance', 'trend', 'momentum', 'volume'],
      'PSYCHOLOGY': ['fear', 'greed', 'emotion', 'discipline', 'patience'],
      'RISK_MANAGEMENT': ['position sizing', 'stop loss', 'risk reward', 'portfolio'],
      'OPTIONS': ['volatility', 'premium', 'theta', 'gamma', 'delta']
    };
    
    const keywords = tradingKeywords[category as keyof typeof tradingKeywords] || [];
    
    for (const keyword of keywords) {
      if (text.toLowerCase().includes(keyword)) {
        concepts.push({
          concept: keyword,
          text: this.extractContext(text, keyword),
          context: this.getContextWindow(text, keyword),
          confidence: 0.8 + Math.random() * 0.2
        });
      }
    }
    
    return concepts;
  }

  private async processKnowledgeExtract(
    extract: RawKnowledgeExtract,
    category: string
  ): Promise<ExtractedKnowledge> {
    return {
      knowledge_id: this.generateKnowledgeId(),
      book_id: extract.book_id,
      chapter: extract.chapter,
      page_range: extract.page_range,
      concept_category: category,
      key_concept: extract.identified_concept,
      detailed_explanation: extract.raw_text,
      practical_applications: this.extractApplications(extract.raw_text),
      validation_rules: this.extractValidationRules(extract.raw_text),
      market_examples: this.extractExamples(extract.raw_text),
      integration_points: this.identifyIntegrationPoints(extract.identified_concept),
      relevance_score: 0, // Will be set during validation
      implementation_priority: 'MEDIUM',
      extracted_at: new Date().toISOString()
    };
  }

  private async validateSystemAlignment(knowledge: ExtractedKnowledge): Promise<number> {
    // Score how well this knowledge aligns with our 5-pillar system
    let alignment = 0;
    
    const systemConcepts = [
      'key_levels', 'momentum', 'premium', 'volume', 'price_action',
      'support', 'resistance', 'candlestick', 'timeframe', 'confluence'
    ];
    
    for (const concept of systemConcepts) {
      if (knowledge.key_concept.toLowerCase().includes(concept) ||
          knowledge.detailed_explanation.toLowerCase().includes(concept)) {
        alignment += 10;
      }
    }
    
    return Math.min(100, alignment);
  }

  /**
   * Build searchable indexes for fast retrieval
   */
  private buildSearchIndexes(knowledge: ExtractedKnowledge[], bookId: string): void {
    console.log('🔍 Building searchable indexes...');
    
    for (const item of knowledge) {
      // Build pattern index
      if (item.key_concept.includes('pattern') || item.key_concept.includes('candle')) {
        if (!this.knowledgeIndex.pattern_index.has(item.key_concept)) {
          this.knowledgeIndex.pattern_index.set(item.key_concept, []);
        }
        this.knowledgeIndex.pattern_index.get(item.key_concept)!.push(item);
      }
      
      // Build search index
      const searchTerms = [
        item.key_concept,
        item.concept_category,
        ...item.practical_applications.join(' ').split(' ')
      ];
      
      for (const term of searchTerms) {
        if (term.length > 3) {
          if (!this.knowledgeIndex.search_index.has(term.toLowerCase())) {
            this.knowledgeIndex.search_index.set(term.toLowerCase(), []);
          }
          this.knowledgeIndex.search_index.get(term.toLowerCase())!.push(item.knowledge_id);
        }
      }
    }
  }

  /**
   * Assess integration quality with our trading system
   */
  private assessIntegrationQuality(
    knowledge: ExtractedKnowledge[],
    category: string
  ): number {
    console.log('📊 Assessing integration quality...');
    
    let totalQuality = 0;
    const weights = {
      'PRICE_ACTION': 1.2,
      'TECHNICAL_ANALYSIS': 1.1,
      'PSYCHOLOGY': 1.0,
      'RISK_MANAGEMENT': 1.3,
      'OPTIONS': 1.1
    };
    
    for (const item of knowledge) {
      const categoryWeight = weights[category as keyof typeof weights] || 1.0;
      const systemAlignment = item.relevance_score / 100;
      const priorityBonus = item.implementation_priority === 'HIGH' ? 0.2 : 0;
      
      totalQuality += (systemAlignment + priorityBonus) * categoryWeight;
    }
    
    return Math.min(100, Math.round((totalQuality / knowledge.length) * 100));
  }

  private queryByPattern(pattern: string): ExtractedKnowledge[] {
    const results: ExtractedKnowledge[] = [];
    
    // Fix Map iteration
    Array.from(this.knowledgeIndex.concept_index.entries()).forEach(([concept, knowledge]) => {
      if (concept.includes(pattern.toLowerCase())) {
        results.push(...knowledge);
      }
    });
    
    return results;
  }

  private queryByConcept(concept: string): ExtractedKnowledge[] {
    return this.knowledgeIndex.concept_index.get(concept) || [];
  }

  private deduplicate<T>(array: T[]): T[] {
    return Array.from(new Set(array));
  }

  // Helper methods for text processing
  private extractContext(text: string, keyword: string): string {
    const index = text.toLowerCase().indexOf(keyword.toLowerCase());
    if (index === -1) return '';
    
    const start = Math.max(0, index - 100);
    const end = Math.min(text.length, index + keyword.length + 100);
    
    return text.substring(start, end);
  }

  private getContextWindow(text: string, keyword: string): string {
    return this.extractContext(text, keyword);
  }

  private extractApplications(text: string): string[] {
    // Extract practical applications from text
    const applications: string[] = [];
    
    if (text.includes('use') || text.includes('apply')) {
      applications.push('Practical application identified in text');
    }
    
    return applications;
  }

  private extractValidationRules(text: string): string[] {
    // Extract validation rules from text
    const rules: string[] = [];
    
    if (text.includes('confirm') || text.includes('validate')) {
      rules.push('Confirmation required per book guidance');
    }
    
    return rules;
  }

  private extractExamples(text: string): string[] {
    // Extract market examples from text
    const examples: string[] = [];
    
    if (text.includes('example') || text.includes('case')) {
      examples.push('Market example provided in source material');
    }
    
    return examples;
  }

  private identifyIntegrationPoints(concept: string): string[] {
    // Identify how this integrates with our system
    const integrationPoints: string[] = [];
    
    const integrationMap: { [key: string]: string[] } = {
      'candlestick': ['Enhances price action pillar', 'Improves pattern recognition'],
      'support': ['Strengthens key levels pillar', 'Better level identification'],
      'volume': ['Validates volume pillar', 'Improves volume interpretation'],
      'momentum': ['Enhances momentum pillar', 'Better cascade analysis']
    };
    
    for (const [key, points] of Object.entries(integrationMap)) {
      if (concept.toLowerCase().includes(key)) {
        integrationPoints.push(...points);
      }
    }
    
    return integrationPoints;
  }

  // ID generation methods
  private generateBookId(title: string, author: string): string {
    return `book_${title.replace(/\s+/g, '_').toLowerCase()}_${author.replace(/\s+/g, '_').toLowerCase()}`;
  }

  private generateRawId(): string {
    return `raw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateKnowledgeId(): string {
    return `knowledge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Helper methods for VPA and Carter extraction
  private extractVPAContext(text: string, keyword: string): string {
    // Extract VPA-specific context with focus on volume-price relationships
    const index = text.toLowerCase().indexOf(keyword.toLowerCase());
    if (index === -1) return '';
    
    const start = Math.max(0, index - 150);
    const end = Math.min(text.length, index + keyword.length + 150);
    
    return text.substring(start, end);
  }

  private getVPAContext(text: string, keyword: string): string {
    return this.extractVPAContext(text, keyword);
  }

  private extractCarterContext(text: string, keyword: string): string {
    // Extract Carter-specific context with focus on practical trading applications
    const index = text.toLowerCase().indexOf(keyword.toLowerCase());
    if (index === -1) return '';
    
    const start = Math.max(0, index - 120);
    const end = Math.min(text.length, index + keyword.length + 120);
    
    return text.substring(start, end);
  }

  private getCarterContext(text: string, keyword: string): string {
    return this.extractCarterContext(text, keyword);
  }
}

// Supporting interfaces
interface ParsedContent {
  page_count: number;
  chapters: {
    chapter_number: number;
    title: string;
    content: string;
    pages: string;
  }[];
  metadata: {
    total_words: number;
    key_terms_frequency: Map<string, number>;
  };
}

interface RawKnowledgeExtract {
  raw_id: string;
  book_id: string;
  chapter: string;
  page_range: string;
  raw_text: string;
  identified_concept: string;
  context: string;
  confidence_score: number;
}

interface IdentifiedConcept {
  concept: string;
  text: string;
  context: string;
  confidence: number;
}

interface ProcessingSummary {
  total_pages_processed: number;
  concepts_extracted: number;
  high_priority_concepts: number;
  system_aligned_concepts: number;
  processing_time: string;
}

export const bookKnowledgeProcessor = new BookKnowledgeProcessor(); 