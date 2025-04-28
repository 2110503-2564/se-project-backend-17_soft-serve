const { deleteNotification } = require('../../controllers/notifications');
const Notification = require('../../models/Notification');

jest.mock('../../models/Notification');
jest.mock('../../models/Restaurant');

describe('deleteNotification', () => {
    let req, res, next;

    beforeEach(() => {
    req = {
        params: { id: '123' },  // ID of the notification
        user: { _id: 'user123', role: 'admin' }  // Logged-in user information
    };
    res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    });

    it('should return 404 if notification not found', async () => {
    Notification.findById = jest.fn().mockResolvedValue(null);  // Mock value as null (notification not found)

    await deleteNotification(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: `No notification found with ID of ${req.params.id}`
    });
    });

    it('should return 403 if user is not authorized to delete notification', async () => {
    const mockNotification = {
        creatorId: { toString: () => 'anotherUserId' },  // creatorId that does not match the user
        deleteOne: jest.fn()
    };
    Notification.findById = jest.fn().mockResolvedValue(mockNotification);  // Mock notification lookup

    // Set user who is neither admin nor the creator of the notification
    req.user = { _id: 'user123', role: 'user' };

    await deleteNotification(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not authorized to delete this notification'
    });
    });

    it('should delete notification if user is creator', async () => {
    const mockNotification = {
        creatorId: { toString: () => 'user123' },  // creatorId matches the user
        deleteOne: jest.fn()
    };
    Notification.findById = jest.fn().mockResolvedValue(mockNotification);  // Mock notification lookup

    await deleteNotification(req, res, next);

    expect(mockNotification.deleteOne).toHaveBeenCalled();  // Verify that deleteOne was called
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {}
    });
    });

    it('should delete notification if user is admin', async () => {
    const mockNotification = {
        creatorId: { toString: () => 'anotherUserId' },  // creatorId does not match the admin
        deleteOne: jest.fn()
    };
    Notification.findById = jest.fn().mockResolvedValue(mockNotification);  // Mock notification lookup

    req.user = { _id: 'admin123', role: 'admin' };  // Admin user

    await deleteNotification(req, res, next);

    expect(mockNotification.deleteOne).toHaveBeenCalled();  // Verify that deleteOne was called
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {}
    });
    });

    it('should return 500 if an error occurs', async () => {
    const errorMessage = 'Something went wrong';
    Notification.findById = jest.fn().mockRejectedValue(new Error(errorMessage));  // Mock an error

    await deleteNotification(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: errorMessage
    });
    });
});
