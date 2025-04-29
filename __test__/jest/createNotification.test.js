const { createNotification } = require('../../controllers/notifications');
const Notification = require('../../models/Notification');

jest.mock('../../models/Notification');
jest.mock('../../models/Restaurant');

const httpMocks = require('node-mocks-http');

describe('createNotification', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('1. should return 400 if admin does not provide targetAudience', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: { title: 'Test', message: 'Hello' },
      user: { role: 'admin' }
    });
    const res = httpMocks.createResponse();

    await createNotification(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData()).toEqual({
      success: false,
      error: 'targetAudience is required for admin'
    });
  });

  it('2. should return 400 if restaurantManager is not verified', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: { title: 'Test', message: 'Hello' },
      user: { role: 'restaurantManager', verified: false }
    });
    const res = httpMocks.createResponse();

    await createNotification(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData()).toEqual({
      success: false,
      error: 'Restaurant manager must be verified to create notifications'
    });
  });

  it('3. should return 400 if restaurantManager has no restaurant', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: { title: 'Test', message: 'Hello' },
      user: { role: 'restaurantManager', verified: true, restaurant: null }
    });
    const res = httpMocks.createResponse();

    await createNotification(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData()).toEqual({
      success: false,
      error: 'Restaurant manager must be associated with a restaurant'
    });
  });

  it('4. should return 400 if role is invalid', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: { title: 'Test', message: 'Hello' },
      user: { role: 'guest' }
    });
    const res = httpMocks.createResponse();

    await createNotification(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData()).toEqual({
      success: false,
      error: 'Invalid user role'
    });
  });

  it('5. should create notification for valid admin', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        title: 'Test',
        message: 'Hello',
        targetAudience: 'All'
      },
      user: { role: 'admin', _id: 'adminId' }
    });
    const res = httpMocks.createResponse();

    const mockNotification = { _id: 'notif123', title: 'Test' };
    Notification.create = jest.fn().mockResolvedValue(mockNotification);

    await createNotification(req, res);

    expect(res.statusCode).toBe(201);
    expect(Notification.create).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Test',
      message: 'Hello',
      targetAudience: 'All',
      creatorId: 'adminId',
      createdBy: 'admin'
    }));
    expect(res._getJSONData()).toEqual({
      success: true,
      data: mockNotification
    });
  });

  it('6. should create notification for valid restaurantManager', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        title: 'Promo',
        message: 'Special offer',
        publishAt: new Date()
      },
      user: {
        role: 'restaurantManager',
        _id: 'rmId',
        verified: true,
        restaurant: 'resto123'
      }
    });
    const res = httpMocks.createResponse();

    const mockNotification = { _id: 'notif456', title: 'Promo' };
    Notification.create = jest.fn().mockResolvedValue(mockNotification);

    await createNotification(req, res);

    expect(res.statusCode).toBe(201);
    expect(Notification.create).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Promo',
      message: 'Special offer',
      targetAudience: 'Customers',
      restaurant: 'resto123',
      creatorId: 'rmId',
      createdBy: 'restaurantManager'
    }));
    expect(res._getJSONData()).toEqual({
      success: true,
      data: mockNotification
    });
  });

  it('7. should return 500 if Notification.create throws error', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        title: 'Error test',
        message: 'Boom',
        targetAudience: 'All'
      },
      user: { role: 'admin', _id: 'adminId' }
    });
    const res = httpMocks.createResponse();

    Notification.create = jest.fn().mockRejectedValue(new Error('DB failure'));

    await createNotification(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._getJSONData()).toEqual({
      success: false,
      error: 'DB failure'
    });
  });
});
