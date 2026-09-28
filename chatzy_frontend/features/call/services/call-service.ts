import axios from "axios";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api").replace(/\/$/, "");

export type CallType = "AUDIO" | "VIDEO";
export type CallStatus = "INITIATED" | "RINGING" | "CONNECTED" | "ENDED" | "REJECTED" | "FAILED";
export type CallResponse = { callId: string; callerId: string; receiverId: string; type: CallType; status: CallStatus; chatId?: string | null; startedAt?: string | null; endedAt?: string | null; durationSeconds?: number | null };

function headers(token: string) { return { Authorization: `Bearer ${token}` }; }
export const callService = {
  async initiate(token: string, receiverId: string, type: CallType, chatId?: string | null) {
    return (await axios.post<CallResponse>(`${API_BASE_URL}/calls/initiate`, { receiverId, type, chatId: chatId || null }, { headers: headers(token) })).data;
  },
  async answer(token: string, callId: string) { return (await axios.post<CallResponse>(`${API_BASE_URL}/calls/${callId}/answer`, undefined, { headers: headers(token) })).data; },
  async end(token: string, callId: string) { return (await axios.post<CallResponse>(`${API_BASE_URL}/calls/${callId}/end`, undefined, { headers: headers(token) })).data; },
  async reject(token: string, callId: string) { return (await axios.post<CallResponse>(`${API_BASE_URL}/calls/${callId}/reject`, undefined, { headers: headers(token) })).data; },
  async getIceServers(token: string) { return (await axios.get<RTCIceServer[]>(`${API_BASE_URL}/calls/ice-servers`, { headers: headers(token) })).data; },
  async sendOffer(token: string, callId: string, sdpOffer: string) { await axios.post(`${API_BASE_URL}/calls/${callId}/sdp-offer`, { callId, sdpOffer }, { headers: headers(token) }); },
  async sendAnswer(token: string, callId: string, sdpAnswer: string) { await axios.post(`${API_BASE_URL}/calls/${callId}/sdp-answer`, { callId, sdpAnswer }, { headers: headers(token) }); },
  async sendIceCandidate(token: string, callId: string, candidate: RTCIceCandidate) { await axios.post(`${API_BASE_URL}/calls/${callId}/ice-candidate`, { callId, candidate: candidate.candidate, sdpMid: candidate.sdpMid, sdpMLineIndex: candidate.sdpMLineIndex }, { headers: headers(token) }); },
};
