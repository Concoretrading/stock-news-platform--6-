'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar, RefreshCw, Plus, CheckCircle, AlertCircle, Database } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';

interface EarningsData {
  id: string;
  stockTicker: string;
  companyName: string;
  earningsDate: string;
  earningsType: string;
  isConfirmed: boolean;
  estimatedEPS?: number;
  estimatedRevenue?: number;
  previousEPS?: number;
  previousRevenue?: number;
  conferenceCallUrl?: string;
  notes?: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

interface UpdateStats {
  added: number;
  updated: number;
  errors: number;
  total: number;
}

export default function EarningsCalendarManager() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<EarningsData[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updateStats, setUpdateStats] = useState<UpdateStats | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEarnings, setNewEarnings] = useState({
    stockTicker: '',
    earningsDate: '',
    earningsType: 'After Close',
    isConfirmed: true,
    notes: ''
  });

  useEffect(() => {
    if (user) {
      fetchEarnings();
    }
  }, [user]);

  const fetchEarnings = async () => {
    try {
      setIsLoading(true);
      const token = await user?.getIdToken();
      const response = await fetch('/api/earnings-calendar', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEarnings(data.earnings || []);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
      setError('Failed to fetch earnings data');
    } finally {
      setIsLoading(false);
    }
  };

  const updateEarningsFromAPI = async () => {
    try {
      setIsUpdating(true);
      setError(null);
      setSuccess(null);

      const token = await user?.getIdToken();
      const response = await fetch('/api/earnings-calendar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'fetch_and_update'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUpdateStats(data.stats);
        setSuccess(data.message);
        // Refresh the earnings list
        await fetchEarnings();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update earnings');
      }
    } catch (error) {
      console.error('Error updating earnings:', error);
      setError(`Failed to update earnings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const addManualEarnings = async () => {
    try {
      if (!newEarnings.stockTicker || !newEarnings.earningsDate) {
        setError('Stock ticker and earnings date are required');
        return;
      }

      const token = await user?.getIdToken();
      const response = await fetch('/api/earnings-calendar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'add_manual',
          data: newEarnings
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message);
        setShowAddForm(false);
        setNewEarnings({
          stockTicker: '',
          earningsDate: '',
          earningsType: 'After Close',
          isConfirmed: true,
          notes: ''
        });
        // Refresh the earnings list
        await fetchEarnings();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add earnings');
      }
    } catch (error) {
      console.error('Error adding earnings:', error);
      setError(`Failed to add earnings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!user || user.email !== 'handrigannick@gmail.com') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Earnings Calendar Manager
          </CardTitle>
          <CardDescription>
            Admin access required to manage earnings calendar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This feature is only available to administrators.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Earnings Calendar Manager
          </CardTitle>
          <CardDescription>
            Automatically update earnings calendar from Alpaca API and manage manual entries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Current Earnings</p>
              <p className="text-sm text-muted-foreground">
                {earnings.length} earnings entries in database
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowAddForm(!showAddForm)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Manual
              </Button>
              <Button 
                onClick={updateEarningsFromAPI} 
                disabled={isUpdating}
                className="flex items-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Update from API
                  </>
                )}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {updateStats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Update Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-green-600">{updateStats.added}</div>
                    <div className="text-muted-foreground">Added</div>
                  </div>
                  <div>
                    <div className="font-medium text-blue-600">{updateStats.updated}</div>
                    <div className="text-muted-foreground">Updated</div>
                  </div>
                  <div>
                    <div className="font-medium text-red-600">{updateStats.errors}</div>
                    <div className="text-muted-foreground">Errors</div>
                  </div>
                  <div>
                    <div className="font-medium">{updateStats.total}</div>
                    <div className="text-muted-foreground">Total</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isUpdating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Updating earnings calendar...</span>
                <span className="text-muted-foreground">This may take a few minutes</span>
              </div>
              <Progress value={undefined} className="w-full" />
            </div>
          )}

          {/* Add Manual Earnings Form */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Add Manual Earnings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stockTicker">Stock Ticker</Label>
                    <Input
                      id="stockTicker"
                      value={newEarnings.stockTicker}
                      onChange={(e) => setNewEarnings(prev => ({ ...prev, stockTicker: e.target.value.toUpperCase() }))}
                      placeholder="AAPL"
                    />
                  </div>
                  <div>
                    <Label htmlFor="earningsDate">Earnings Date</Label>
                    <Input
                      id="earningsDate"
                      type="datetime-local"
                      value={newEarnings.earningsDate}
                      onChange={(e) => setNewEarnings(prev => ({ ...prev, earningsDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="earningsType">Earnings Type</Label>
                    <Select 
                      value={newEarnings.earningsType} 
                      onValueChange={(value) => setNewEarnings(prev => ({ ...prev, earningsType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Before Open">Before Open</SelectItem>
                        <SelectItem value="After Close">After Close</SelectItem>
                        <SelectItem value="Pre-Market">Pre-Market</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isConfirmed"
                      checked={newEarnings.isConfirmed}
                      onChange={(e) => setNewEarnings(prev => ({ ...prev, isConfirmed: e.target.checked }))}
                    />
                    <Label htmlFor="isConfirmed">Confirmed</Label>
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={newEarnings.notes}
                    onChange={(e) => setNewEarnings(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Q1 2024 earnings call"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={addManualEarnings} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Earnings
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Earnings List */}
      <Card>
        <CardHeader>
          <CardTitle>Current Earnings Calendar</CardTitle>
          <CardDescription>
            All earnings entries in the database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : earnings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No earnings data found. Click "Update from API" to fetch data.
            </div>
          ) : (
            <div className="space-y-2">
              {earnings.map((earning) => (
                <div key={earning.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium">{earning.stockTicker}</div>
                      <div className="text-sm text-muted-foreground">{earning.companyName}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {new Date(earning.earningsDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(earning.earningsDate).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={earning.isConfirmed ? "default" : "secondary"}>
                      {earning.isConfirmed ? "Confirmed" : "Unconfirmed"}
                    </Badge>
                    <Badge variant="outline">
                      {earning.earningsType}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {earning.source}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 