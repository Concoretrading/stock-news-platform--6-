import { NextRequest, NextResponse } from 'next/server';
import { tradingKnowledgeBase } from '@/lib/services/trading-knowledge-base';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { foundation_analysis, market_context } = body;

    console.log('📚 Knowledge Enhancement API called');
    console.log('Enhancing analysis with expert book knowledge...');

    const enhancedAnalysis = await tradingKnowledgeBase.enhanceDecision(
      foundation_analysis,
      market_context
    );

    return NextResponse.json({
      success: true,
      data: enhancedAnalysis,
      message: 'Analysis enhanced with expert knowledge',
      knowledge_summary: {
        contributions: enhancedAnalysis.knowledge_contributions,
        implementation_rules: enhancedAnalysis.implementation_rules,
        enhancement_quality: enhancedAnalysis.enhanced_analysis.enhancement_quality
      }
    });

  } catch (error) {
    console.error('Knowledge Enhancement API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to enhance analysis with knowledge base',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 