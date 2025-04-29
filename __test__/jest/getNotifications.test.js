const { getNotifications } = require('../../controllers/notifications');
const Notification = require('../../models/Notification');
const Reservation = require('../../models/Reservation');
const User = require('../../models/User');

jest.mock('../../models/Notification');
jest.mock('../../models/Reservation');
jest.mock('../../models/User');
jest.mock('../../models/Restaurant');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('1. getNotifications - admin', () => {
  let req, res, mockQuery;

  beforeEach(() => {
    res = mockRes();
    req = {
      user: {
        role: 'admin',
        _id: 'admin123'
      },
      query: {
        select: 'title,message',
        sort: 'createdAt',
        page: '2',
        limit: '1'
      }
    };

    mockQuery = {
      find: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(1),
      populate: jest.fn().mockReturnThis(),
      clone: jest.fn().mockReturnThis(),
      countDocuments: jest.fn().mockResolvedValue(3),
    };

    Notification.find = jest.fn().mockReturnValue(mockQuery);
  });

  it('1.1. should return notifications for admin with pagination and filtering', async () => {
    const fakeNotifications = [{ _id: 'noti1', title: 'Test 1' }];

    Notification.find.mockImplementation(() => ({
      ...mockQuery,
      find: jest.fn().mockReturnThis(),
      then: (resolve) => resolve(fakeNotifications),
    }));

    await getNotifications(req, res);

    expect(Notification.find).toHaveBeenCalledWith({});
    expect(mockQuery.select).toHaveBeenCalledWith('title message');
    expect(mockQuery.sort).toHaveBeenCalledWith('createdAt');
    expect(mockQuery.skip).toHaveBeenCalledWith(1);
    expect(mockQuery.limit).toHaveBeenCalledWith(1);
    expect(mockQuery.clone().countDocuments).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      count: fakeNotifications.length,
      total: 3,
      pagination: { next: { page: 3, limit: 1 }, prev: { page: 1, limit: 1 } },
      data: fakeNotifications
    }));
  });

  it('1.2. should handle error correctly', async () => {
    Notification.find.mockImplementation(() => { throw new Error('Something went wrong'); });

    await getNotifications(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: 'Something went wrong',
    }));
  });
});

describe('2. getNotifications - restaurantManager', () => {
  let req, res, mockQuery;

  beforeEach(() => {
    res = mockRes();
    req = {
      user: {
        role: 'restaurantManager',
        _id: 'manager123'
      },
      query: {
        page: '1',
        limit: '2',
        sort: 'createdAt',
        select: 'title,message'
      }
    };

    mockQuery = {
      find: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(2),
      populate: jest.fn().mockReturnThis(),
      clone: jest.fn().mockReturnThis(),
      countDocuments: jest.fn().mockResolvedValue(5),
    };

    Notification.find = jest.fn().mockReturnValue(mockQuery);
  });

  it('2.1. should return notifications for restaurantManager', async () => {
    const fakeNotifications = [
      { _id: 'noti1', title: 'Manager noti 1' },
      { _id: 'noti2', title: 'Manager noti 2' }
    ];

    Notification.find.mockImplementation(() => ({
      ...mockQuery,
      find: jest.fn().mockReturnThis(),
      then: (resolve) => resolve(fakeNotifications),
    }));

    await getNotifications(req, res);

    expect(Notification.find).toHaveBeenCalledWith(expect.objectContaining({ $or: expect.any(Array) }));
    expect(mockQuery.select).toHaveBeenCalledWith('title message');
    expect(mockQuery.sort).toHaveBeenCalledWith('createdAt');
    expect(mockQuery.skip).toHaveBeenCalledWith(0);
    expect(mockQuery.limit).toHaveBeenCalledWith(2);
    expect(mockQuery.clone().countDocuments).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('2.2. should handle errors for restaurantManager', async () => {
    Notification.find.mockImplementation(() => { throw new Error('DB error'); });

    await getNotifications(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: 'DB error',
    }));
  });
});

describe('3. getNotifications - user', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { role: 'user', _id: 'user123' },
      query: {}
    };
    res = mockRes();
  });

  it('3.1. should return notifications for user', async () => {
    const mockReservations = [
      { _id: 'res1', restaurant: 'rest1', revDate: new Date('2025-04-20') },
      { _id: 'res2', restaurant: 'rest2', revDate: new Date('2025-04-21') }
    ];

    Reservation.find = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(mockReservations)
    });

    User.find = jest.fn()
      .mockResolvedValueOnce([{ _id: 'manager1', restaurant: 'rest1' }]) // restaurant managers
      .mockResolvedValueOnce([{ _id: 'admin1' }]); // admins

    const mockQuery = {
      find: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      clone: jest.fn().mockReturnThis(),
      countDocuments: jest.fn().mockResolvedValue(1),
      populate: jest.fn().mockReturnThis(),
    };

    Notification.find = jest.fn().mockReturnValue(mockQuery);

    await getNotifications(req, res);

    expect(Reservation.find).toHaveBeenCalledWith({ user: 'user123' });
    expect(User.find).toHaveBeenCalled();
    expect(Notification.find).toHaveBeenCalledWith(expect.objectContaining({ $or: expect.any(Array) }));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('3.2. should handle errors for user', async () => {
    Reservation.find.mockImplementation(() => { throw new Error('Reservation fetch error'); });

    await getNotifications(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: 'Reservation fetch error'
    }));
  });

  it('3.3. should update latestReservationMap if revDate is newer', async () => {
    const olderDate = new Date('2025-04-20');
    const newerDate = new Date('2025-04-22');
  
    const mockReservations = [
      { _id: 'res1', restaurant: 'rest1', revDate: olderDate },
      { _id: 'res2', restaurant: 'rest1', revDate: newerDate } // Newer revDate
    ];
  
    Reservation.find = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(mockReservations)
    });
  
    User.find = jest.fn()
      .mockResolvedValueOnce([{ _id: 'manager1', restaurant: 'rest1' }])
      .mockResolvedValueOnce([{ _id: 'admin1' }]);
  
    const mockQuery = {
      find: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      clone: jest.fn().mockReturnThis(),
      countDocuments: jest.fn().mockResolvedValue(1),
      populate: jest.fn().mockReturnThis(),
    };
  
    Notification.find = jest.fn().mockReturnValue(mockQuery);
  
    const req = {
      user: { role: 'user', _id: 'user123' },
      query: {}
    };
    const res = mockRes();
  
    await getNotifications(req, res);
  
    // Check that the newer date was selected
    expect(Reservation.find).toHaveBeenCalledWith({ user: 'user123' });
    expect(Notification.find).toHaveBeenCalledWith(expect.objectContaining({ $or: expect.any(Array) }));
  
    expect(res.status).toHaveBeenCalledWith(200);
  });
  
});
