import axios from './axios';

export const getThreads = (params) => axios.get('/community/threads', { params });
export const getThread = (id) => axios.get(`/community/threads/${id}`);
export const getThreadReplies = (id) => axios.get(`/community/threads/${id}/replies`);
export const createThread = (data) => axios.post('/community/threads', data);
export const replyToThread = (id, data) => axios.post(`/community/threads/${id}/reply`, data);
export const upvoteThread = (id) => axios.patch(`/community/threads/${id}/upvote`);
export const upvoteReply = (id) => axios.patch(`/community/replies/${id}/upvote`);
export const deleteThread = (id) => axios.delete(`/community/threads/${id}`);
export const deleteReply = (id) => axios.delete(`/community/replies/${id}`);
export const pinThread = (id) => axios.patch(`/community/threads/${id}/pin`);
export const lockThread = (id) => axios.patch(`/community/threads/${id}/lock`);
export const markThreadResolved = (id) => axios.patch(`/community/threads/${id}/resolve`);
