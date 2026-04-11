// Lim Yih Fei A0256993J
import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import { AuthProvider } from '../context/auth';
import Orders from '../pages/user/Orders';
import { MemoryRouter } from 'react-router-dom';

jest.mock('axios');
jest.mock('../context/cart', () => ({
  useCart: () => [[], jest.fn()]
}));
jest.mock('../context/search', () => ({
  useSearch: () => [[], jest.fn()]
}));

describe('Orders Component Frontend Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const mockOrders = [
    {
      _id: "order1",
      status: "Shipped",
      buyer: { name: "Test Buyer 1" },
      createAt: new Date().toISOString(),
      payment: { success: true },
      products: [
        {
          _id: "prod1",
          name: "Test Laptop",
          description: "A fast laptop for testing",
          price: 999
        }
      ]
    }
  ];

  it('should fetch and display orders when auth token is present (Top-Down)', async () => {
    localStorage.setItem(
      'auth',
      JSON.stringify({
        user: { name: 'Test User' },
        token: 'fake-jwt-token'
      })
    );

    axios.get.mockImplementation((url) => {
        if (url === '/api/v1/auth/orders') return Promise.resolve({ data: mockOrders });
        return Promise.resolve({ data: { success: true, category: [] } });
    });

    await act(async () => {
      render(
        <AuthProvider>
          <MemoryRouter>
            <Orders />
          </MemoryRouter>
        </AuthProvider>
      );
    });

    expect(screen.getByText('All Orders')).toBeInTheDocument();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/orders');
    });

    await waitFor(() => {
      expect(screen.getByText('Shipped')).toBeInTheDocument();
      expect(screen.getByText('Test Buyer 1')).toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Test Laptop')).toBeInTheDocument();
    });
  });

  it('should not call the API if token is not available', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <MemoryRouter>
            <Orders />
          </MemoryRouter>
        </AuthProvider>
      );
    });

    expect(axios.get).not.toHaveBeenCalledWith('/api/v1/auth/orders');

    const laptopElement = screen.queryByText('Test Laptop');
    expect(laptopElement).not.toBeInTheDocument();
  });
});
