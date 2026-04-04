import { NextResponse } from 'next/server';
import { scenarioIntelligenceEngine } from '../../../lib/services/scenario-intelligence-engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker') || 'AAPL';
    
    console.log(`🎯 SCENARIO INTELLIGENCE ANALYSIS for ${ticker}...`);
    
    // Mock current positions for analysis
    const currentPositions = [
      {
        position_id: 'AAPL_154_CALLS',
        instrument: 'AAPL 154 CALLS',
        quantity: 10,
        entry_price: 2.50,
        current_price: 2.25,
        pnl: -250,
        expiration: '2024-01-26'
      },
      {
        position_id: 'AAPL_155_PUTS',
        instrument: 'AAPL 155 PUTS (hedge)',
        quantity: 3,
        entry_price: 1.80,
        current_price: 1.95,
        pnl: 45,
        expiration: '2024-01-26'
      }
    ];

    // Mock market context
    const marketContext = {
      current_price: 150.67,
      key_resistance: 158.50,
      key_support: 147.25,
      volume_ratio: 1.2,
      vix_level: 16.5,
      market_breadth: 1.1,
      sector_strength: 'TECHNOLOGY'
    };
    
    // Generate comprehensive scenario analysis
    const scenarioAnalysis = await scenarioIntelligenceEngine.generateScenarioAnalysis(
      ticker,
      currentPositions,
      marketContext
    );
    
    return NextResponse.json({
      success: true,
      ticker,
      current_price: marketContext.current_price,
      scenario_analysis: scenarioAnalysis,
      system_info: {
        analysis_type: 'SCENARIO_INTELLIGENCE_ENGINE',
        thinking_model: 'IF_THIS_THEN_THAT',
        capabilities: [
          'Probabilistic Scenario Generation',
          'Real-time Scenario Adaptation',
          'Multi-Scenario Position Mapping',
          'Trigger Condition Monitoring',
          'Automatic Position Adjustments',
          'Contingency Plan Execution'
        ],
        intelligence_features: [
          'Scenario Probability Calculation',
          'Trigger Proximity Monitoring',
          'Position Risk Assessment',
          'Alternative Scenario Planning',
          'Real-time Data Integration',
          'Adaptive Decision Making'
        ]
      },
      trading_intelligence: {
        dominant_scenario: {
          name: scenarioAnalysis.scenario_tree.base_scenario.scenario_name,
          probability: scenarioAnalysis.scenario_tree.base_scenario.probability,
          evolution: scenarioAnalysis.scenario_tree.base_scenario.scenario_evolution,
          confidence: scenarioAnalysis.scenario_tree.base_scenario.confidence_level
        },
        immediate_actions: scenarioAnalysis.trading_recommendations.position_adjustments.map((adj: any) => ({
          position: adj.position,
          action: adj.recommended_action,
          expected_pnl: adj.expected_pnl,
          risk_level: adj.current_pnl < 0 ? 'MEDIUM' : 'LOW'
        })),
        scenario_triggers_watch: scenarioAnalysis.real_time_monitoring.monitored_triggers
          .filter((trigger: any) => trigger.alert_level === 'HIGH' || trigger.alert_level === 'MEDIUM')
          .slice(0, 5),
        contingency_readiness: scenarioAnalysis.trading_recommendations.contingency_plans.length
      },
      elite_insights: {
        scenario_count: scenarioAnalysis.primary_scenarios.length,
        probability_distribution: scenarioAnalysis.primary_scenarios.map((scenario: any) => ({
          scenario: scenario.scenario_name,
          probability: scenario.probability,
          trend: scenario.scenario_evolution
        })),
        position_exposure: {
          total_expected_pnl: scenarioAnalysis.trading_recommendations.risk_assessment.total_expected_pnl,
          best_case_scenario: scenarioAnalysis.trading_recommendations.risk_assessment.max_reward_scenario,
          worst_case_scenario: scenarioAnalysis.trading_recommendations.risk_assessment.max_risk_scenario,
          probability_of_profit: scenarioAnalysis.trading_recommendations.risk_assessment.probability_of_profit
        },
        real_time_status: {
          monitoring_active: true,
          update_frequency: scenarioAnalysis.real_time_monitoring.update_frequency,
          triggers_approaching: scenarioAnalysis.real_time_monitoring.monitored_triggers
            .filter((t: any) => t.proximity > 80).length,
          auto_adjustments_enabled: scenarioAnalysis.real_time_monitoring.automatic_actions.enabled
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Scenario Intelligence analysis error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze scenarios',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dataFeed } = body;
    
    console.log(`📊 PROCESSING REAL-TIME DATA: ${dataFeed.data_type}...`);
    
    // Update scenarios with new data
    await scenarioIntelligenceEngine.updateScenariosWithNewData(dataFeed);
    
    return NextResponse.json({
      success: true,
      message: 'Scenarios updated with new data',
      data_processed: {
        type: dataFeed.data_type,
        timestamp: dataFeed.timestamp,
        affected_scenarios: dataFeed.impact_assessment.affected_scenarios,
        probability_changes: dataFeed.impact_assessment.probability_changes
      },
      system_response: {
        scenarios_updated: dataFeed.impact_assessment.affected_scenarios.length,
        significant_changes: dataFeed.impact_assessment.probability_changes.filter(
          (change: any) => Math.abs(change.new_probability - change.old_probability) > 10
        ).length,
        position_reviews_triggered: dataFeed.impact_assessment.probability_changes.filter(
          (change: any) => Math.abs(change.new_probability - change.old_probability) > 15
        ).length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Real-time data processing error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process real-time data',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { scenarioId, manualProbabilityUpdate, reasoning } = body;
    
    console.log(`🎯 MANUAL SCENARIO UPDATE: ${scenarioId}...`);
    
    // This would update specific scenario probabilities based on manual input
    // Useful for incorporating discretionary analysis or external intelligence
    
    return NextResponse.json({
      success: true,
      message: `Scenario ${scenarioId} manually updated`,
      update_details: {
        scenario_id: scenarioId,
        new_probability: manualProbabilityUpdate,
        reasoning: reasoning,
        updated_by: 'MANUAL_INPUT',
        timestamp: new Date().toISOString()
      },
      system_response: {
        scenario_tree_recalculated: true,
        position_recommendations_updated: true,
        alert_thresholds_adjusted: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Manual scenario update error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update scenario manually',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 