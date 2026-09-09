import { randomUUID } from 'crypto';

import prisma from '@modheshwari/db';

import { producer as defaultProducer, TOPICS } from './config';
import { logger } from '../lib/logger';

export interface FanoutParams {
  initiatedBy: string;
  recipientIds: string[];
  channels: string[];
  message: any;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  fanoutId?: string;
}

/**
 * Performs publish fanout operation.
 * @param {import("/Users/nalindalal/modheshwari/apps/be/kafka/fanout-producer").FanoutParams} params - Description of params
 * @param {{ connect?: () => Promise<void>; send: (arg: any) => Promise<any>; }} producerOverride - Description of producerOverride
 * @returns {Promise<{ fanoutId: string; recipientCount: number; timestamp: string; }>} Description of return value
 */
export async function publishFanout(
  params: FanoutParams,
  producerOverride?: { connect?: () => Promise<void>; send: (arg: any) => Promise<any> },
) {
  const producer = producerOverride || defaultProducer;
  const fanoutId = params.fanoutId || randomUUID();
  const timestamp = new Date().toISOString();

  const event = {
    fanoutId,
    initiatedBy: params.initiatedBy,
    recipientIds: params.recipientIds,
    channels: params.channels,
    message: params.message,
    priority: params.priority || 'normal',
    timestamp,
  };

  try {
    // Create audit record for this fanout
    try {
      await prisma.fanoutAudit.create({
        data: {
          fanoutId,
          initiatedBy: String(params.initiatedBy),
          recipientCount: params.recipientIds.length,
          channels: params.channels,
          message: params.message as any,
          priority: params.priority || 'normal',
          status: 'PENDING',
        },
      });
    } catch (e) {
      logger.warn('Failed to write fanout audit record:', e);
    }
    if (producer.connect) await producer.connect();

    await producer.send({
      topic: TOPICS.NOTIFICATION_EVENTS,
      messages: [
        {
          key: fanoutId,
          value: JSON.stringify(event),
          headers: {
            'event-type': 'notification.fanout',
            'initiated-by': String(params.initiatedBy),
            priority: String(params.priority || 'normal'),
          },
        },
      ],
    });

    return { fanoutId, recipientCount: params.recipientIds.length, timestamp };
  } catch (err) {
    logger.error('Failed to publish fanout event:', err);
    throw new Error('Failed to publish fanout event');
  }
}

export default publishFanout;
