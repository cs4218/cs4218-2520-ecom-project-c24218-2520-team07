import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import { AuthProvider, useAuth } from '../context/auth';
import Profile from '../pages/user/Profile';
import { MemoryRouter } from 'react-router-dom';
import toast from 'react-hot-toast';

jest.mock('axios');
jest.mock('react-hot-toast');
jest.mock('../context/search', () => ({
  useSearch: () => [[], jest.fn()]
}));
jest.mock('../context/cart', () => ({
  useCart: () => [[], jest.fn()]
}));

describe('Profile Component Frontend Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });

    const mockUser = {
        name: "Old Name",
        email: "old@example.com",
        phone: "1234567890",
        address: "123 Old Street"
    };

    const mockUpdatedUser = {
        name: "New Name",
        email: "old@example.com",
        phone: "0987654321",
        address: "456 New Ave"
    };

    it('should prefill user data and successfully update profile upon submission (Top-Down)', async () => {
        // 1. Arrange: Setup AuthProvider state via localStorage (Top)
        localStorage.setItem('auth', JSON.stringify({
            user: mockUser,
            token: "fake-jwt-token"
        }));

        // 2. Mock network response for the API update call (Bottom)
        axios.put.mockResolvedValueOnce({
            data: { updatedUser: mockUpdatedUser }
        });

        // 3. Act: Render the component wrapped with AuthProvider
        render(
            <AuthProvider>
                <MemoryRouter>
                    <Profile />
                </MemoryRouter>
            </AuthProvider>
        );

        // Verify initial state prefilled correctly from Auth Context
        expect(await screen.findByDisplayValue('Old Name')).toBeInTheDocument();
        expect(screen.getByDisplayValue('old@example.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument();
        expect(screen.getByDisplayValue('123 Old Street')).toBeInTheDocument();

        // 4. Act: Simulate user typing new values
        const nameInput = screen.getByPlaceholderText('Enter Your Name');
        const phoneInput = screen.getByPlaceholderText('Enter Your Phone');
        const addressInput = screen.getByPlaceholderText('Enter Your Address');
        const passwordInput = screen.getByPlaceholderText('Enter Your Password');

        fireEvent.change(nameInput, { target: { value: 'New Name' } });
        fireEvent.change(phoneInput, { target: { value: '0987654321' } });
        fireEvent.change(addressInput, { target: { value: '456 New Ave' } });
        fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });

        // 5. Act: Submit form
        const submitButton = screen.getByRole('button', { name: /UPDATE/i });
        fireEvent.click(submitButton);

        // 6. Assert: Network payload logic matches the updated inputs precisely
        await waitFor(() => {
            expect(axios.put).toHaveBeenCalledWith('/api/v1/auth/profile', {
                name: 'New Name',
                email: 'old@example.com',
                password: 'newpassword123',
                phone: '0987654321',
                address: '456 New Ave'
            });
        });

        // 7. Assert: Success toast notification shown
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Profile Updated Successfully');
        });

        // 8. Assert: Global Context & LocalStorage are correctly updated with new user details
        const lsData = JSON.parse(localStorage.getItem('auth'));
        expect(lsData.user.name).toBe('New Name');
        expect(lsData.user.phone).toBe('0987654321');
        expect(lsData.user.address).toBe('456 New Ave');
    });

    it('should show an error toast if the API returns an error message', async () => {
        localStorage.setItem('auth', JSON.stringify({
            user: mockUser,
            token: "fake-jwt-token"
        }));

        axios.put.mockResolvedValueOnce({
            data: { error: "Short password" }
        });

        render(
            <AuthProvider>
                <MemoryRouter>
                    <Profile />
                </MemoryRouter>
            </AuthProvider>
        );

        expect(await screen.findByDisplayValue('Old Name')).toBeInTheDocument();

        const submitButton = screen.getByRole('button', { name: /UPDATE/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Short password');
        });
    });
});
