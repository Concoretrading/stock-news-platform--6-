
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ArrowUpRight, ArrowDownRight, AlertTriangle, Activity,
    BrainCircuit, Layers, Crosshair, Zap, CloudRain
} from "lucide-react";

// Types matching the service (would import shared types in real app)
interface GravityLevel {
    price: number;
    type: 'RIP_TO' | 'RIP_FROM';
    event_context: string;
    strength: number;
}

interface Scenario {
    name: string;
    probability: number;
    description: string;
    price_targets: number[];
}

export function GravityDashboard() {
    // Mock Data (In real app, fetch from /api/news-gravity)
    const [levels, setLevels] = useState<GravityLevel[]>([
        { price: 435.50, type: 'RIP_TO', event_context: 'CPI Beat (Oct 23)', strength: 90 },
        { price: 420.00, type: 'RIP_FROM', event_context: 'CPI Beat (Oct 23)', strength: 85 },
        { price: 480.00, type: 'RIP_TO', event_context: 'ATH Rejection', strength: 95 },
    ]);

    const [scenarios, setScenarios] = useState<Scenario[]>([
        { name: 'BEAR CASE', probability: 50, description: 'Data hot/hawkish. Reality check.', price_targets: [420.00] },
        { name: 'BULL CASE', probability: 25, description: 'Data soft/dovish. Shorts squeeze.', price_targets: [435.50, 480.00] },
        { name: 'BASE CASE', probability: 25, description: 'Drift and decay.', price_targets: [428.00] }
    ]);

    const [trap, setTrap] = useState({ active: false, type: 'NONE', description: 'No immediate trap detected' });

    return (
        <div className="space-y-6 p-6 bg-slate-950 text-slate-100 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
                        <BrainCircuit className="w-6 h-6 text-purple-400" />
                        NewsGravity Analyzer
                    </h2>
                    <p className="text-slate-400 text-sm">The "Soul" of the Market: Mapping Levels, Psychology & Traps</p>
                </div>
                <Badge variant="outline" className="border-purple-500 text-purple-400 bg-purple-950/30">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                    GRAVITY: ACTIVE
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* 1. SCENARIO PLANNING (Top Left) */}
                <Card className="bg-slate-900 border-slate-800 col-span-1 md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            Scenario Probabilities
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {scenarios.map((scenario) => (
                            <div key={scenario.name} className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className={`font-bold ${scenario.name.includes('BULL') ? 'text-green-400' :
                                        scenario.name.includes('BEAR') ? 'text-red-400' : 'text-slate-300'
                                        }`}>
                                        {scenario.name}
                                    </span>
                                    <span className="text-slate-400">{scenario.probability}%</span>
                                </div>
                                <Progress
                                    value={scenario.probability}
                                    className={`h-2 ${scenario.name.includes('BULL') ? 'bg-green-950 [&>div]:bg-green-500' :
                                        scenario.name.includes('BEAR') ? 'bg-red-950 [&>div]:bg-red-500' : 'bg-slate-800'
                                        }`}
                                />
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>{scenario.description}</span>
                                    <span className="font-mono text-slate-300">Target: ${scenario.price_targets[0]}</span>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* 2. BEHAVIORAL BIASES (Right Column - Spans 2 Rows) */}
                <Card className="bg-slate-900 border-slate-800 col-span-1 md:col-start-3 md:row-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <BrainCircuit className="w-5 h-5 text-pink-400" />
                            The Instinct (Biases)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                            <div className="text-xs text-slate-500 mb-1">Loss Aversion (Prospect Theory)</div>
                            <div className="flex items-center gap-2 text-green-400 text-sm font-bold">
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                Balanced (1.0x)
                            </div>
                        </div>
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                            <div className="text-xs text-slate-500 mb-1">Herd Behavior</div>
                            <div className="flex items-center gap-2 text-yellow-500 text-sm font-bold">
                                <AlertTriangle className="w-3 h-3" />
                                High Greed (Warning)
                            </div>
                        </div>
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                            <div className="text-xs text-slate-500 mb-1">Anchoring</div>
                            <div className="flex items-center gap-2 text-blue-400 text-sm font-bold">
                                <Crosshair className="w-3 h-3" />
                                Locked on $480.00
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-800">
                            <div className="text-xs font-bold text-slate-400 mb-2">STRATEGIC ADVICE</div>
                            <ul className="text-xs text-slate-300 space-y-2 list-disc pl-4">
                                <li>FADE the breakout if volume drops.</li>
                                <li>Respect the $480 anchor.</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. TRAP DETECTION (Bottom Left) */}
                <Card className={`border-slate-800 col-span-1 md:col-span-2 ${trap.active ? 'bg-red-950/20 border-red-900' : 'bg-slate-900'}`}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Activity className={`w-5 h-5 ${trap.active ? 'text-red-500 animate-bounce' : 'text-slate-500'}`} />
                            Trap Detector
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {trap.active ? (
                            <div className="text-red-400 font-bold border border-red-800 bg-red-950/50 p-4 rounded-lg">
                                🚨 {trap.type} DETECTED!
                                <p className="text-sm font-normal text-red-300 mt-2">{trap.description}</p>
                            </div>
                        ) : (
                            <div className="text-green-400 font-medium flex items-center gap-2 border border-green-900/50 bg-green-950/20 p-4 rounded-lg">
                                ✅ No Traps Detected
                                <span className="text-xs text-green-600 block">Market acting rationally</span>
                            </div>
                        )}

                        <div className="mt-6 space-y-2">
                            <h4 className="text-xs font-uppercase text-slate-500 font-bold tracking-wider">Psychology vs. Consensus</h4>
                            <div className="flex justify-between text-sm border-b border-slate-800 pb-2">
                                <span className="text-slate-400">Crowd Emotion</span>
                                <span className="text-yellow-400">GREED (45%)</span>
                            </div>
                            <div className="flex justify-between text-sm border-b border-slate-800 pb-2">
                                <span className="text-slate-400">Institutional Flow</span>
                                <span className="text-purple-400">ACCUMULATION</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. INSTITUTIONAL FLOW (The Wallet) */}
                <Card className="bg-slate-900 border-slate-800 col-span-1 md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Layers className="w-5 h-5 text-emerald-400" />
                            The Wallet (Big Money)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <div className="text-xs text-slate-500 mb-1">Gap Status</div>
                                <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                                    <ArrowUpRight className="w-4 h-4" />
                                    GAP UP (Value Shift)
                                </div>
                                <div className="text-xs text-slate-600 mt-1">Institutions Buying Value</div>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <div className="text-xs text-slate-500 mb-1">Re-Test Strength</div>
                                <div className="flex items-center gap-2 text-green-400 text-sm font-bold">
                                    LOW Pressure
                                </div>
                                <div className="text-xs text-slate-600 mt-1">Support Likely</div>
                            </div>
                        </div>
                        <div className="p-3 bg-slate-950/50 rounded-lg border border-emerald-900/30 flex justify-between items-center">
                            <span className="text-slate-400 text-sm font-bold">Intent:</span>
                            <span className="text-emerald-400 font-mono font-bold tracking-wider">ACCUMULATION (80%)</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 5. TECHNICAL CONFLUENCE (The Skeleton) - NEW */}
                <Card className="bg-slate-900 border-slate-800 col-span-1 md:col-start-3 md:row-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Activity className="w-5 h-5 text-cyan-400" />
                            The Skeleton (Techs)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                            <div className="text-xs text-slate-500 mb-1">Keltner Channels (2x ATR)</div>
                            <div className="flex items-center gap-2 text-cyan-400 text-sm font-bold">
                                <Activity className="w-3 h-3" />
                                INSIDE BANDS
                            </div>
                            <Progress value={60} className="h-1 mt-2 bg-slate-900 [&>div]:bg-cyan-500" />
                        </div>
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                            <div className="text-xs text-slate-500 mb-1">MA Structure</div>
                            <div className="flex items-center gap-2 text-green-400 text-sm font-bold">
                                <ArrowUpRight className="w-3 h-3" />
                                Bullish Alignment
                            </div>
                            <div className="text-xs text-slate-600 mt-1">&gt; 21EMA | &gt; 50SMA | &gt; 200SMA</div>
                        </div>
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                            <div className="text-xs text-slate-500 mb-1">Extension / Exhaustion</div>
                            <div className="flex items-center gap-2 text-slate-300 text-sm font-bold">
                                Neutral
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 6. CLOUD INTELLIGENCE (The Atmosphere) - NEW */}
                <Card className="bg-slate-900 border-slate-800 col-span-1 md:col-start-3 md:row-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <CloudRain className="w-5 h-5 text-indigo-400" />
                            The Atmosphere (Cloud)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                            <div className="text-xs text-slate-500 mb-1">Trend Bias (Daily)</div>
                            <div className="flex items-center gap-2 text-green-400 text-sm font-bold">
                                <ArrowUpRight className="w-3 h-3" />
                                BULLISH (Above Cloud)
                            </div>
                        </div>
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                            <div className="text-xs text-slate-500 mb-1">Cloud Physics</div>
                            <div className="flex justify-between items-center">
                                <span className="text-indigo-300 text-xs font-bold">THICK CLOUD (Strong Support)</span>
                                <Badge variant="outline" className="border-green-500/50 text-green-400 text-[10px]">Bounce Likely</Badge>
                            </div>
                            <Progress value={80} className="h-1 mt-2 bg-slate-900 [&>div]:bg-indigo-500" />
                        </div>
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                            <div className="text-xs text-slate-500 mb-1">Approach Strategy</div>
                            <div className="flex items-center gap-2 text-white text-sm font-bold">
                                SCALE IN LONG
                            </div>
                            <div className="text-xs text-slate-600 mt-1">Confluence: 50SMA + Cloud Top</div>
                        </div>
                    </CardContent>
                </Card>

                {/* 7. GRAVITY LEVELS (Muscle Memory) */}
                <Card className="bg-slate-900 border-slate-800 col-span-1 md:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Layers className="w-5 h-5 text-blue-400" />
                            Gravity Levels (Rip-To / Rip-From Memory)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {levels.map((level, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-md ${level.type === 'RIP_TO' ? 'bg-red-950/50 text-red-400' : 'bg-green-950/50 text-green-400'}`}>
                                            {level.type === 'RIP_TO' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="font-mono text-lg font-bold">${level.price.toFixed(2)}</div>
                                            <div className="text-xs text-slate-500">{level.event_context}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="secondary" className="bg-slate-800 text-slate-300 group-hover:bg-slate-700">
                                            Str: {level.strength}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
