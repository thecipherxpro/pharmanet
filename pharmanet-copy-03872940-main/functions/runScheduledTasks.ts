import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Run all scheduled tasks for the Pharmanet platform
 * This function should be called hourly via an external cron service
 * (e.g., cron-job.org, EasyCron, or a cloud scheduler)
 * 
 * Endpoint URL: [Your app URL]/api/functions/runScheduledTasks
 * Frequency: Every hour (0 * * * *)
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const results = {
      timestamp: new Date().toISOString(),
      tasks: []
    };

    // Task 1: Mark shifts as completed
    try {
      const completionResponse = await base44.asServiceRole.functions.invoke('markShiftsAsCompleted', {});
      results.tasks.push({
        name: 'markShiftsAsCompleted',
        status: 'success',
        data: completionResponse.data
      });
    } catch (error) {
      results.tasks.push({
        name: 'markShiftsAsCompleted',
        status: 'error',
        error: error.message
      });
    }

    // Task 2: Send shift reminders
    try {
      const reminderResponse = await base44.asServiceRole.functions.invoke('sendShiftReminder', {});
      results.tasks.push({
        name: 'sendShiftReminder',
        status: 'success',
        data: reminderResponse.data
      });
    } catch (error) {
      results.tasks.push({
        name: 'sendShiftReminder',
        status: 'error',
        error: error.message
      });
    }

    // Summary
    const successCount = results.tasks.filter(t => t.status === 'success').length;
    const errorCount = results.tasks.filter(t => t.status === 'error').length;

    return Response.json({
      success: errorCount === 0,
      message: `Scheduled tasks completed: ${successCount} successful, ${errorCount} failed`,
      results
    });

  } catch (error) {
    console.error('Error running scheduled tasks:', error);
    return Response.json({ 
      error: 'Failed to run scheduled tasks',
      details: error.message 
    }, { status: 500 });
  }
});