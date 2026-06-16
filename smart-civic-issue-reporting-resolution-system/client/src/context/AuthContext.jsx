
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { http } from '../api/http';

const AuthContext = createContext(null);

const getStoredUser = () => {
	const raw = localStorage.getItem('user');
	if (!raw) return null;
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
};

export function AuthProvider({ children }) {
	const [user, setUser] = useState(getStoredUser());
	const [token, setToken] = useState(localStorage.getItem('token') || '');
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const storedToken = localStorage.getItem('token');
		if (!storedToken) {
			setLoading(false);
			return;
		}

		http
			.get('/auth/me')
			.then(({ data }) => {
				const nextUser = data?.data?.user || data?.user || null;
				if (nextUser) {
					setUser(nextUser);
					localStorage.setItem('user', JSON.stringify(nextUser));
				}
			})
			.catch(() => {
				localStorage.removeItem('token');
				localStorage.removeItem('user');
				setUser(null);
				setToken('');
			})
			.finally(() => setLoading(false));
	}, []);

	async function login(email, password) {
		const { data } = await http.post('/auth/login', { email, password });
		const nextToken = data?.token || data?.data?.token || '';
		const nextUser = data?.user || data?.data?.user || null;
		if (nextToken) {
			localStorage.setItem('token', nextToken);
			setToken(nextToken);
		}
		if (nextUser) {
			localStorage.setItem('user', JSON.stringify(nextUser));
			setUser(nextUser);
		}
		return { token: nextToken, user: nextUser };
	}

	async function register(name, email, password, phone) {
		const { data } = await http.post('/auth/register', { name, email, password, phone });
		return data;
	}

	function logout() {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		setUser(null);
		setToken('');
	}

	const value = useMemo(
		() => ({ user, token, loading, login, logout, register }),
		[user, token, loading]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used within AuthProvider');
	return ctx;
}
