// token generation and expiration
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../server');
const { User, Organisation } = require('../models');

describe('Token Generation', () => {
  let user;

  beforeEach(async () => {
    // Clear the database before each test
    await User.destroy({ where: {}, truncate: true });

    // Create a user
    user = await User.create({
      userId: 'user1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      phone: '1234567890',
    });
  });

  it('It Should Generate a Valid JWT Token', async () => {
    const accessToken = await user.generateAccessToken();

    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

    expect(decoded.userId).toBe(user.userId);
    expect(decoded.email).toBe(user.email);
    expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });
});

// organisation management
describe('Organisation Management', () => {
  let user1, user2, organisation1;

  beforeEach(async () => {
    // Clear the database before each test
    await User.destroy({ where: {}, truncate: true });
    await Organisation.destroy({ where: {}, truncate: true });

    // Create two users
    user1 = await User.create({
      userId: 'user1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      phone: '1234567890',
    });

    user2 = await User.create({
      userId: 'user2',
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'password456',
      phone: '0987654321',
    });

    // Create two organisations
    organisation1 = await Organisation.create({
      orgId: 'org1',
      name: 'John\'s Organisation',
      description: 'Organisation for John',
    });


    // Add user1 to organisation1
    await organisation1.addUser(user1);
  });

  it('It Should Get All Organisations for a User', async () => {
    const loginData = {
      email: 'john@example.com',
      password: 'password123',
    };

    // Login user1
    const loginResponse = await request(app)
      .post('/auth/login')
      .send(loginData)
      .expect(200);

    const accessToken = loginResponse.body.data.accessToken;

    // Get all organisations for user1
    const organisationsResponse = await request(app)
      .get('/api/organisations')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(organisationsResponse.body.data.organisations).toHaveLength(1);
    expect(organisationsResponse.body.data.organisations[0].orgId).toBe(organisation1.orgId);
  });

  it('It Should Get a Single Organisation', async () => {
    const loginData = {
      email: 'john@example.com',
      password: 'password123',
    };

    // Login user1
    const loginResponse = await request(app)
      .post('/auth/login')
      .send(loginData)
      .expect(200);

    const accessToken = loginResponse.body.data.accessToken;

    // Get organisation1 for user1
    const organisationResponse = await request(app)
      .get(`/api/organisations/${organisation1.orgId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(organisationResponse.body.data.orgId).toBe(organisation1.orgId);
    expect(organisationResponse.body.data.name).toBe(organisation1.name);
    expect(organisationResponse.body.data.description).toBe(organisation1.description);
  });

  it('It Should Create a New Organisation', async () => {
    const loginData = {
      email: 'john@example.com',
      password: 'password123',
    };

    // Login user1
    const loginResponse = await request(app)
      .post('/auth/login')
      .send(loginData)
      .expect(200);

    const accessToken = loginResponse.body.data.accessToken;

    const organisationData = {
      name: 'New Organisation',
      description: 'This is a new organisation',
    };

    // Create a new organisation for user1
    const organisationResponse = await request(app)
      .post('/api/organisations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(organisationData)
      .expect(201);

    expect(organisationResponse.body.data.name).toBe(`${user1.firstName}'s Organisation`);
    expect(organisationResponse.body.data.description).toBe(organisationData.description);
  });

  it('It Should Add a User to an Organisation', async () => {
    const loginData = {
      email: 'john@example.com',
      password: 'password123',
    };

    // Login user1
    const loginResponse = await request(app)
      .post('/auth/login')
      .send(loginData)
      .expect(200);

    const accessToken = loginResponse.body.data.accessToken;

    // Add user2 to organisation1
    const addUserResponse = await request(app)
      .post(`/api/organisations/${organisation1.orgId}/users`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ userId: user2.userId })
      .expect(200);

    expect(addUserResponse.body.message).toBe('User added to organisation successfully');
  });
});

// register functionality and login
describe('User Registration', () => {
  beforeEach(async () => {
    // Clear the database before each test
    await User.destroy({ where: {}, truncate: true });
    await Organisation.destroy({ where: {}, truncate: true });
  });

  it('It Should Register User Successfully with Default Organisation', async () => {
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      phone: '1234567890',
    };

    const response = await request(app)
      .post('/auth/register')
      .send(userData)
      .expect(201);

    expect(response.body.data.user.firstName).toBe(userData.firstName);
    expect(response.body.data.user.lastName).toBe(userData.lastName);
    expect(response.body.data.user.email).toBe(userData.email);
    expect(response.body.data.user.phone).toBe(userData.phone);
    expect(response.body.data.accessToken).toBeDefined();

    const organisation = await Organisation.findOne({
      where: { name: `${userData.firstName}'s Organisation` },
    });
    expect(organisation).toBeDefined();
  });

  it('It Should Fail If Required Fields Are Missing', async () => {
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      // email is missing
      password: 'password123',
      phone: '1234567890',
    };

    const response = await request(app)
      .post('/auth/register')
      .send(userData)
      .expect(422);

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'email', message: expect.any(String) }),
      ])
    );
  });

  it('It Should Fail if there\'s Duplicate Email', async () => {
    const userData1 = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      phone: '1234567890',
    };

    const userData2 = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password456',
      phone: '0987654321',
    };

    await request(app)
      .post('/auth/register')
      .send(userData1)
      .expect(201);

    const response = await request(app)
      .post('/auth/register')
      .send(userData2)
      .expect(422);

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'email', message: expect.any(String) }),
      ])
    );
  });
});

describe('User Login', () => {
    beforeEach(async () => {
      // Clear the database before each test
      await User.destroy({ where: {}, truncate: true });
    });
  
    it('It Should Log the user in successfully', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '1234567890',
      };
  
      // Register the user first
      await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);
  
      const loginData = {
        email: userData.email,
        password: userData.password,
      };
  
      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);
  
      expect(response.body.data.user.firstName).toBe(userData.firstName);
      expect(response.body.data.user.lastName).toBe(userData.lastName);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.phone).toBe(userData.phone);
      expect(response.body.data.accessToken).toBeDefined();
    });
  
    it('It Should Fail to log in with invalid credentials', async () => {
      const loginData = {
        email: 'invalid@example.com',
        password: 'wrongpassword',
      };
  
      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);
  
      expect(response.body.message).toBe('Authentication failed');
    });
  });
