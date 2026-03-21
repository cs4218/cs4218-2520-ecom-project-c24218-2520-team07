import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import { AuthProvider } from '../context/auth';
import Users from '../pages/admin/Users';
import { MemoryRouter } from 'react-router-dom';

jest.mock('axios');
jest.mock('../context/search', () => ({
  useSearch: () => [[], jest.fn()]
}));
jest.mock('../context/cart', () => ({
  useCart: () => [[], jest.fn()]
}));
jest.mock('../hooks/useCategory', () => () => []);

describe('Admin Users Component Frontend Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });

    it('should successfully mount and display structural layout dependencies (Layout, AdminMenu) for Admin User', async () => {
        // Arrange: Setup AuthProvider state via localStorage reflecting an Admin (role: 1)
        localStorage.setItem('auth', JSON.stringify({
            user: { name: "Admin Tester", email: "admin@test.com", role: 1 },
            token: "fake-admin-jwt-token"
        }));

        // Arrange: mock potential unmocked nested network requests natively just in case
        axios.get.mockResolvedValue({ data: { ok: true } });

        // Act
        render(
            <AuthProvider>
                <MemoryRouter>
                    <Users />
                </MemoryRouter>
            </AuthProvider>
        );

        // Assert: Ensure Layout consumed the user from AuthProvider asynchronously and loaded correctly
        expect(await screen.findByText('Admin Tester')).toBeInTheDocument();

        // Assert: Ensure the Users page specific body loads perfectly
        expect(screen.getByRole('heading', { name: /All Users/i })).toBeInTheDocument();

        // Assert: Ensure the AdminMenu layout panel rendered exactly its standard navigation list options conditionally
        expect(screen.getByText('Admin Panel')).toBeInTheDocument();
        expect(screen.getByText('Create Category')).toBeInTheDocument();
        expect(screen.getByText('Create Product')).toBeInTheDocument();
        expect(screen.getByText('Products')).toBeInTheDocument();
        expect(screen.getByText('Orders')).toBeInTheDocument();
    });
});
