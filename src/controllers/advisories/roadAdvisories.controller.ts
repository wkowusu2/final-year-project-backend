import { Request, Response } from 'express';
import { AdvisoryInput, AdvisoryStatus, createRoadAdvisory, listAdminAdvisories, listDriverAdvisories, updateRoadAdvisory } from '../../repository/roadAdvisories.js';

const statuses = new Set<AdvisoryStatus>(['planned', 'active', 'completed', 'cancelled']);
const impacts = new Set(['low', 'moderate', 'high']);
const types = new Set(['maintenance', 'road_closure', 'diversion', 'signal_work', 'event_restriction']);

function parseDate(value: unknown, name: string, optional = false) {
  if (value == null && optional) return null;
  if (typeof value !== 'string') throw new Error(`${name} must be an ISO timestamp`);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`${name} must be an ISO timestamp`);
  return date;
}

function parseInput(body: unknown): AdvisoryInput {
  if (typeof body !== 'object' || body === null) throw new Error('Invalid advisory details');
  const value = body as Record<string, unknown>;
  if (typeof value.title !== 'string' || !value.title.trim() || typeof value.description !== 'string' || !value.description.trim() || typeof value.roadName !== 'string' || !value.roadName.trim() || typeof value.city !== 'string' || !value.city.trim()) throw new Error('Title, description, road name, and city are required');
  if (typeof value.type !== 'string' || !types.has(value.type)) throw new Error('Invalid advisory type');
  if (typeof value.status !== 'string' || !statuses.has(value.status as AdvisoryStatus)) throw new Error('Invalid advisory status');
  if (typeof value.impact !== 'string' || !impacts.has(value.impact)) throw new Error('Invalid advisory impact');
  const osmId = value.affectedRoadOsmId == null || value.affectedRoadOsmId === '' ? null : String(value.affectedRoadOsmId);
  if (osmId && !/^\d+$/.test(osmId)) throw new Error('Affected OSM road ID must be numeric');
  const latitude = value.latitude == null || value.latitude === '' ? null : Number(value.latitude);
  const longitude = value.longitude == null || value.longitude === '' ? null : Number(value.longitude);
  if ((latitude != null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) || (longitude != null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180))) throw new Error('Invalid advisory coordinates');
  return { title: value.title.trim(), description: value.description.trim(), type: value.type, status: value.status as AdvisoryStatus, impact: value.impact as 'low' | 'moderate' | 'high', affectedRoadOsmId: osmId, roadName: value.roadName.trim(), city: value.city.trim(), latitude, longitude, startsAt: parseDate(value.startsAt, 'startsAt')!, endsAt: parseDate(value.endsAt, 'endsAt', true) };
}

export async function getDriverAdvisories(_req: Request, res: Response) { try { return res.status(200).json({ success: true, data: { advisories: await listDriverAdvisories() }, error: null }); } catch { return res.status(500).json({ success: false, data: null, error: 'Unable to load road advisories' }); } }
export async function getAdminAdvisories(_req: Request, res: Response) { try { return res.status(200).json({ success: true, data: { advisories: await listAdminAdvisories() }, error: null }); } catch { return res.status(500).json({ success: false, data: null, error: 'Unable to load road advisories' }); } }
export async function postAdminAdvisory(req: Request, res: Response) { try { const adminId = res.locals.user?.sub; if (typeof adminId !== 'string') return res.status(401).json({ success: false, data: null, error: 'Administrator identity is required' }); const advisory = await createRoadAdvisory(parseInput(req.body), adminId); return res.status(201).json({ success: true, data: { advisory }, error: null }); } catch (error) { return res.status(400).json({ success: false, data: null, error: error instanceof Error ? error.message : 'Unable to create advisory' }); } }
export async function patchAdminAdvisory(req: Request, res: Response) { try { if (typeof req.params.advisoryId !== 'string') throw new Error('Invalid advisory'); const advisory = await updateRoadAdvisory(req.params.advisoryId, parseInput(req.body)); if (!advisory) return res.status(404).json({ success: false, data: null, error: 'Advisory not found' }); return res.status(200).json({ success: true, data: { advisory }, error: null }); } catch (error) { return res.status(400).json({ success: false, data: null, error: error instanceof Error ? error.message : 'Unable to update advisory' }); } }
