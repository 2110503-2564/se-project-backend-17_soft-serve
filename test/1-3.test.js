const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Notification = require('../models/Notification');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Helper function
const createValidNotificationData = (override = {}) => {
  const userId = new mongoose.Types.ObjectId();
  const restaurantId = new mongoose.Types.ObjectId();
  
  return {
    title: 'Test Notification',
    message: 'This is a test notification message',
    creatorId: userId,
    restaurant: restaurantId,
    createdBy: 'restaurantManager',
    targetAudience: 'Customers',
    publishAt: new Date(),
    createdAt: new Date(),
    ...override
  };
};

describe('Notification Model Tests', () => {
  describe('Required Fields Validation', () => {
    test('should validate that title is required', () => {
      const notificationData = createValidNotificationData({ title: undefined });
      const notification = new Notification(notificationData);
      const error = notification.validateSync();
      
      expect(error).toBeDefined();
      expect(error.errors.title).toBeDefined();
      expect(error.errors.title.message).toContain('required');
    });

    test('should validate that createdBy is required', () => {
      const notificationData = createValidNotificationData({ createdBy: undefined });
      const notification = new Notification(notificationData);
      const error = notification.validateSync();
      
      expect(error).toBeDefined();
      expect(error.errors.createdBy).toBeDefined();
      expect(error.errors.createdBy.message).toEqual('Path `createdBy` is required.');
    });

    test('should validate that targetAudience is required', () => {
      const notificationData = createValidNotificationData({ targetAudience: undefined });
      const notification = new Notification(notificationData);
      const error = notification.validateSync();
      
      expect(error).toBeDefined();
      expect(error.errors.targetAudience).toBeDefined();
      expect(error.errors.targetAudience.message).toEqual('Path `targetAudience` is required.');
    });
  });

  describe('Field Validation', () => {
    test('should validate createdBy enum values', () => {
      const notificationData = createValidNotificationData({ createdBy: 'invalidRole' });
      const notification = new Notification(notificationData);
      const error = notification.validateSync();
      
      expect(error).toBeDefined();
      expect(error.errors.createdBy).toBeDefined();
      expect(error.errors.createdBy.message).toContain('`invalidRole` is not a valid enum value');
    });

    test('should accept valid createdBy values', () => {
      ['admin', 'restaurantManager', 'system'].forEach(role => {
        const notificationData = createValidNotificationData({ createdBy: role });
        const notification = new Notification(notificationData);
        const error = notification.validateSync();
        
        // Only check createdBy field - there might be other validation errors
        expect(error?.errors?.createdBy).toBeUndefined();
      });
    });

    test('should validate targetAudience allowed values', () => {
      const notificationData = createValidNotificationData({ targetAudience: 'InvalidAudience' });
      const notification = new Notification(notificationData);
      const error = notification.validateSync();
      
      expect(error).toBeDefined();
      expect(error.errors.targetAudience).toBeDefined();
      expect(error.errors.targetAudience.message).toEqual('targetAudience must be Customers, RestaurantManagers, All, or Reservation ObjectId');
    });

    test('should accept valid string targetAudience values', () => {
      ['Customers', 'RestaurantManagers', 'All'].forEach(audience => {
        const notificationData = createValidNotificationData({ targetAudience: audience });
        const notification = new Notification(notificationData);
        const error = notification.validateSync();
        
        // Only check targetAudience field
        expect(error?.errors?.targetAudience).toBeUndefined();
      });
    });

    test('should accept ObjectId as targetAudience', () => {
        const reservationId = new mongoose.Types.ObjectId(); 
        const notificationData = createValidNotificationData({ targetAudience: reservationId });
        
        const notification = new Notification(notificationData);
        const error = notification.validateSync();
        
        expect(error?.errors?.targetAudience).toBeUndefined();
    });
  });

  describe('Conditional Required Fields', () => {
    test('should require creatorId when createdBy is admin', () => {
      const notificationData = createValidNotificationData({ 
        createdBy: 'admin',
        creatorId: undefined
      });
      
      const notification = new Notification(notificationData);
      const error = notification.validateSync();
      
      expect(error).toBeDefined();
      expect(error.errors.creatorId).toBeDefined();
      expect(error.errors.creatorId.message).toEqual('creatorId is required when createdBy is admin or restaurantManager');
    });

    test('should require creatorId when createdBy is restaurantManager', () => {
      const notificationData = createValidNotificationData({ 
        createdBy: 'restaurantManager',
        creatorId: undefined
      });
      
      const notification = new Notification(notificationData);
      const error = notification.validateSync();
      
      expect(error).toBeDefined();
      expect(error.errors.creatorId).toBeDefined();
      expect(error.errors.creatorId.message).toEqual('creatorId is required when createdBy is admin or restaurantManager');
    });

    test('should not require creatorId when createdBy is system', () => {
      const notificationData = createValidNotificationData({ 
        createdBy: 'system',
        creatorId: undefined
      });
      
      const notification = new Notification(notificationData);
      const error = notification.validateSync();
      
      // Check specifically that creatorId is not an error
      expect(error?.errors?.creatorId).toBeUndefined();
    });

    test('should require restaurant when createdBy is restaurantManager', () => {
      const notificationData = createValidNotificationData({ 
        createdBy: 'restaurantManager',
        restaurant: undefined
      });
      
      const notification = new Notification(notificationData);
      const error = notification.validateSync();
      
      expect(error).toBeDefined();
      expect(error.errors.restaurant).toBeDefined();
      expect(error.errors.restaurant.message).toEqual('restaurant is required when createdBy is restaurantManager');
    });

    test('should not require restaurant when createdBy is admin', () => {
      const notificationData = createValidNotificationData({ 
        createdBy: 'admin',
        restaurant: undefined
      });
      
      const notification = new Notification(notificationData);
      const error = notification.validateSync();
      
      // Check specifically that restaurant is not an error
      expect(error?.errors?.restaurant).toBeUndefined();
    });
  });

  describe('Default Values', () => {
    test('should set default value for publishAt if not provided', () => {
      const beforeTest = new Date();
      const notificationData = createValidNotificationData({ publishAt: undefined });
      const notification = new Notification(notificationData);
      
      expect(notification.publishAt).toBeDefined();
      expect(notification.publishAt).toBeInstanceOf(Date);
      expect(notification.publishAt.getTime()).toBeGreaterThanOrEqual(beforeTest.getTime());
    });

    test('should set default value for createdAt if not provided', () => {
      const beforeTest = new Date();
      const notificationData = createValidNotificationData({ createdAt: undefined });
      const notification = new Notification(notificationData);
      
      expect(notification.createdAt).toBeDefined();
      expect(notification.createdAt).toBeInstanceOf(Date);
      expect(notification.createdAt.getTime()).toBeGreaterThanOrEqual(beforeTest.getTime());
    });
  });

  // More specific tests for the user story US1-3
  describe('US1-3: Restaurant Manager Notification Tests', () => {
    test('should validate restaurantManager can create notification for Customers', () => {
      const notificationData = createValidNotificationData({
        createdBy: 'restaurantManager',
        targetAudience: 'Customers'
      });
      
      const notification = new Notification(notificationData);
      const error = notification.validateSync();
      
      expect(error).toBeUndefined();
    });

    test('should reject invalid fields when restaurantManager creates notification', () => {
      // Missing title
      const notificationData = createValidNotificationData({
        createdBy: 'restaurantManager',
        title: undefined
      });
      
      const notification = new Notification(notificationData);
      const error = notification.validateSync();
      
      expect(error).toBeDefined();
      expect(error.errors.title).toBeDefined();
    });
  });
});