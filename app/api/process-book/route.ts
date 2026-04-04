import { NextRequest, NextResponse } from 'next/server';
import { bookKnowledgeProcessor } from '@/lib/services/book-knowledge-processor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { book_file, book_metadata, process_expert_books } = body;

    // Process specific expert books
    if (process_expert_books) {
      console.log('📚 Processing Anna Coulling & John Carter Expert Books');

      const expertResults = await bookKnowledgeProcessor.processExpertTradingBooks();

      return NextResponse.json({
        success: true,
        data: expertResults,
        message: 'Successfully processed expert trading books',
        expert_processing: {
          anna_coulling: {
            title: "A Complete Guide to Volume Price Analysis",
            concepts_extracted: expertResults.anna_coulling_vpa.extracted_concepts,
            integration_quality: `${expertResults.anna_coulling_vpa.integration_quality}%`,
            focus_areas: ['Volume Price Analysis', 'Accumulation/Distribution', 'Smart Money Detection']
          },
          john_carter: {
            title: "Mastering the Trade, Third Edition",
            concepts_extracted: expertResults.john_carter_mastering.extracted_concepts,
            integration_quality: `${expertResults.john_carter_mastering.integration_quality}%`,
            focus_areas: ['Opening Range Breakouts', 'Risk Management', 'Market Internals']
          }
        }
      });
    }

    // Process individual book
    console.log(`📚 Processing book: ${book_metadata.title}`);
    console.log(`📖 Author: ${book_metadata.author}`);
    console.log(`📊 Category: ${book_metadata.category}`);

    const processingResult = await bookKnowledgeProcessor.processCompleteBook(
      book_file,
      book_metadata
    );

    return NextResponse.json({
      success: true,
      data: processingResult,
      message: `Successfully processed "${book_metadata.title}"`,
      processing_details: {
        book_id: processingResult.book_id,
        concepts_extracted: processingResult.extracted_concepts,
        integration_quality: `${processingResult.integration_quality}%`,
        storage_status: 'STORED_AND_INDEXED'
      }
    });

  } catch (error) {
    console.error('Book Processing API Error:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to process book',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query_type = searchParams.get('query_type');
    const expert_books = searchParams.get('expert_books');

    if (expert_books === 'true') {
      // Demonstrate expert book knowledge
      return NextResponse.json({
        success: true,
        data: {
          anna_coulling_knowledge: {
            volume_price_validation: "Volume should validate price movement - rising prices with rising volume confirms buying pressure",
            smart_money_accumulation: "Smart money accumulates gradually, creating volume patterns showing institutional interest",
            practical_applications: [
              "Validate breakouts with volume expansion",
              "Identify accumulation zones for entries",
              "Spot distribution patterns for exits"
            ]
          },
          john_carter_knowledge: {
            opening_range_breakout: "Trade the resolution of the first 30-minute range. Let amateurs open the market, pros trade the breakout.",
            dynamic_position_sizing: "Increase size on A+ setups (TTM Squeeze + Internals alignment). Risk small on B setups.",
            market_internals: "Price lies, Internals ($TICK, $TRIN) tell the truth. Stay out if they diverge.",
            practical_applications: [
              "Buy TTM Squeeze firing with Volume",
              "Fade moves if $TICK opposes price",
              "Wait for 30-min range before aggression"
            ]
          },
          behavioral_finance_knowledge: {
            prospect_theory: "Losses loom larger than gains (2:1 ratio) - leads to holding losers too long and selling winners too early",
            availability_heuristic: "Recent vivid events (crashes/pumps) are overweighted in probability assessment",
            practical_applications: [
              "Fade panic flushes driven by Loss Aversion",
              "Discount headline-driven moves (Availability Heuristic)",
              "Identify herd exhaustion points"
            ]
          },
          mindset_coach_knowledge: {
            probabilistic_thinking: "Trading is a game of odds, not certainty. Any single trade is just one data point in a large sample.",
            zone_entry: "Enter without hesitation or conflict. The risk is accepted in advance. You don't need to know what happens next to make money.",
            practical_applications: [
              "Think in sets of 20 trades (Mark Douglas)",
              "Drop expectations of 'being right' on any single trade",
              "Review execution quality separate from P&L"
            ]
          },
          world_view_knowledge: {
            big_cycle: "Empires rise and fall in predictable cycles (Debt -> Conflict -> Decline). We are in the late-stage cycle.",
            systemic_manipulation: "Corporatocracy uses debt to enslave nations/entities. Watch for debt-heavy sectors dependent on policy.",
            practical_applications: [
              "Hold hard assets/innovation during currency debasement",
              "Avoid sectors reliant on government bailouts",
              "Monitor wealth gap as conflict precursor"
            ]
          },
          institutional_knowledge: {
            hedge_fund_alpha: "Alpha comes from asymmetric bets (Soros) and exploiting inefficiencies (Renaissance), not 'predicting' the future.",
            intermarket_analysis: "All markets are linked. DXY drives Commodities. Bond Yields drive Equities. Watch the flows.",
            practical_applications: [
              "Seek 5:1 asymmetric rewards (Mallaby)",
              "Never trade Oil/Gold without checking Dollar (Murphy)",
              "Watch Yields for Tech rotation cues"
            ]
          },
          investor_knowledge: {
            margin_of_safety: "Buy when price is significantly below intrinsic value (e.g., 60 cents on the dollar) to protect against error.",
            mr_market: "Treat market volatility as an opportunity (manic/depressive partner), not a guide. Buy fear, sell euphoria.",
            practical_applications: [
              "Buy when fundamentals are strong but price is weak (Oversold)",
              "Fade emotional panic selling (Mr. Market's depression)",
              "Distinguish between 'Price' (Noise) and 'Value' (Truth)"
            ]
          },
          news_event_knowledge: {
            truth_revealer: "News is a catalyst that reveals the truth of market positioning. Watch the reaction, not the headline.",
            three_time_dimensions: "Connect Past (memory), Real-time (assessment), and Upcoming (preparation) to validate price.",
            scenarios_of_possibilities: "Map risk branches: If [News] + [Bullish Reaction] = True Strength. If [News] + [Failure] = Trap.",
            practical_applications: [
              "Fade knee-jerk emotional moves (Real-time)",
              "Map future risk (Upcoming) before entering",
              "Use Past reactions to gauge deviation"
            ]
          }
        },
        message: 'Expert book knowledge available for trading decisions'
      });
    }

    if (query_type === 'knowledge_query') {
      // Query knowledge for current market conditions
      const marketContext = {
        trend: 'BULLISH',
        volatility: 'MEDIUM',
        key_level_proximity: 'NEAR_RESISTANCE'
      };

      const foundationAnalysis = {
        price_action: { candle_type: 'ENGULFING' },
        key_levels: { level_interaction: 'AT_RESISTANCE' },
        volume: { quality: 85, expansion: true }
      };

      const knowledgeResult = await bookKnowledgeProcessor.queryKnowledgeForDecision(
        marketContext,
        foundationAnalysis
      );

      return NextResponse.json({
        success: true,
        data: {
          ...knowledgeResult,
          expert_guidance: {
            anna_coulling: "Volume expansion on breakout confirms institutional buying pressure",
            john_carter: "High probability setup warrants increased position size with ATR-based stops"
          }
        },
        message: 'Knowledge retrieved with expert book guidance'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Book processing system ready - Anna Coulling VPA & John Carter expertise integrated'
    });

  } catch (error) {
    console.error('Knowledge Query API Error:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to query knowledge base',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 