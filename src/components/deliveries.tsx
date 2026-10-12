'use client';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  orderLabels,
  paymentLabels,
  formatPrice,
  type Order,
  type Drone,
  type Offer,
} from '@/lib/domain';
export { orderLabels, paymentLabels } from '@/lib/domain';
import { api } from '@/lib/api-client';
import { Shell, Wallet, message } from './shell';
export function Orders({ orders }: { orders: Order[] }) {
  return (
    <div className="stack">
      {orders.length === 0 ? (
        <p className="muted">No deliveries yet.</p>
      ) : (
        orders.map((order) => (
          <Link className="order" href={'/orders/' + order.id} key={order.id}>
            <div className="row between">
              <strong>
                {order.origin} → {order.destination}
              </strong>
              <span className="price">{formatPrice(order.priceAmount)}</span>
            </div>
            <p className="muted">
              {order.packageDescription} · {order.packageWeightKg} kg
            </p>
            <div className="row">
              <span className="pill">{orderLabels[order.status]}</span>
              <span className="pill">{paymentLabels[order.paymentStatus]}</span>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
export function Customer({
  username,
  mode,
  orders,
}: {
  username: string;
  mode: string;
  orders: Order[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const data = new FormData(e.currentTarget);
    const num = (name: string) => {
      const value = data.get(name);
      return value ? Number(value) : undefined;
    };
    try {
      const order = await api<Order>('/api/orders', {
        origin: data.get('origin'),
        destination: data.get('destination'),
        packageDescription: data.get('description'),
        packageWeightKg: Number(data.get('weightKg')),
        originLat: num('originLat'),
        originLng: num('originLng'),
        destinationLat: num('destinationLat'),
        destinationLng: num('destinationLng'),
      });
      router.push('/orders/' + order.id);
      router.refresh();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell username={username} mode={mode}>
      <span className="pill">Customer cabinet</span>
      <h1>Parcel. Route. Delivery.</h1>
      <p className="muted">
        Create an order — the server calculates the price before payment confirmation.
      </p>
      <div className="grid">
        <section className="card">
          <h2>New delivery</h2>
          <form className="stack" onSubmit={create}>
            <label>
              Origin
              <input name="origin" required maxLength={240} placeholder="Almaty, Abay street 10" />
            </label>
            <label>
              Destination
              <input
                name="destination"
                required
                maxLength={240}
                placeholder="Almaty, Kunaev street 12"
              />
            </label>
            <div className="row">
              <label>
                Origin latitude
                <input
                  name="originLat"
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  placeholder="43.238"
                />
              </label>
              <label>
                Origin longitude
                <input
                  name="originLng"
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  placeholder="76.889"
                />
              </label>
            </div>
            <div className="row">
              <label>
                Destination latitude
                <input
                  name="destinationLat"
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  placeholder="43.218"
                />
              </label>
              <label>
                Destination longitude
                <input
                  name="destinationLng"
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  placeholder="76.917"
                />
              </label>
            </div>
            <p className="muted">
              Coordinates are optional — with them the server estimates distance and time more
              accurately.
            </p>
            <label>
              Parcel description
              <textarea
                name="description"
                required
                maxLength={1000}
                placeholder="Documents in an envelope"
              />
            </label>
            <label>
              Weight, kg
              <input
                name="weightKg"
                type="number"
                min="0.01"
                max="5"
                step="0.01"
                required
                placeholder="0.5"
              />
            </label>
            <p className="muted">
              Small parcels up to 5 kg. The quote is not a real carrier tariff.
            </p>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button disabled={busy}>{busy ? 'Creating…' : 'Quote and create order'}</button>
          </form>
        </section>
        <Wallet />
      </div>
      <section className="card" style={{ marginTop: 24 }}>
        <h2>My deliveries</h2>
        <Orders orders={orders} />
      </section>
    </Shell>
  );
}
export function Operator({
  username,
  mode,
  orders,
  drones,
  offers,
}: {
  username: string;
  mode: string;
  orders: Order[];
  drones: Drone[];
  offers: Offer[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selection, setSelection] = useState<Record<string, string>>({});
  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError('');
    try {
      await api('/api/drones', {
        droneModel: data.get('droneModel'),
        serialNumber: data.get('serialNumber'),
        registrationNumber: data.get('registrationNumber'),
        maxPayloadKg: Number(data.get('maxPayloadKg')),
      });
      form.reset();
      router.refresh();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function accept(id: string) {
    setBusy(true);
    setError('');
    try {
      const result = await api<Order>('/api/orders/' + id + '/action', {
        action: 'accept',
        droneId: selection[id],
      });
      router.push('/orders/' + result.id);
      router.refresh();
    } catch (e) {
      setError(message(e));
      router.refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell username={username} mode={mode}>
      <span className="pill">Operator cabinet</span>
      <h1>Your drone. New routes.</h1>
      <p className="muted">Accept paid orders and update delivery stages.</p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="grid">
        <section className="card">
          <h2>My drones</h2>
          <div className="stack">
            {drones.map((drone) => (
              <div className="order" key={drone.id}>
                <strong>{drone.droneModel}</strong>
                <p className="muted">
                  {drone.registrationNumber} · Up to {drone.maxPayloadKg} kg ·{' '}
                  {drone.status === 'available' ? 'Available' : 'Busy'}
                </p>
              </div>
            ))}
          </div>
          <hr />
          <form className="stack" onSubmit={add}>
            <label>
              Drone model
              <input name="droneModel" required maxLength={100} placeholder="DJI FlyCart 30" />
            </label>
            <label>
              Serial number
              <input name="serialNumber" required maxLength={100} placeholder="SN-0000001" />
            </label>
            <label>
              Registration number
              <input name="registrationNumber" required maxLength={100} placeholder="REG-0000001" />
            </label>
            <label>
              Payload capacity, kg
              <input name="maxPayloadKg" required type="number" min="0.01" max="25" step="0.01" />
            </label>
            <p className="muted">
              Serial and registration numbers are unique. A new drone is available and cleared for
              flights.
            </p>
            <button disabled={busy}>Add drone</button>
          </form>
        </section>
        <Wallet />
      </div>
      <section className="card" style={{ marginTop: 24 }}>
        <h2>Open offers</h2>
        <p className="muted">
          The exact address and parcel contents become visible only after accepting the order.
          Refresh the list to see new offers.
        </p>
        <button className="secondary" disabled={busy} onClick={() => router.refresh()}>
          Refresh offers
        </button>
        <div className="stack" style={{ marginTop: 20 }}>
          {offers.length === 0 ? (
            <p className="muted">No paid orders available right now.</p>
          ) : (
            offers.map((offer) => (
              <div className="order" key={offer.id}>
                <div className="row between">
                  <strong>
                    {offer.originArea} → {offer.destinationArea}
                  </strong>
                  <span className="price">{formatPrice(offer.priceAmount)}</span>
                </div>
                <p className="muted">Parcel {offer.packageWeightKg} kg</p>
                <div className="row">
                  <select
                    aria-label="Choose a drone"
                    value={selection[offer.id] || ''}
                    onChange={(e) => setSelection({ ...selection, [offer.id]: e.target.value })}
                  >
                    <option value="">Choose a suitable drone</option>
                    {drones
                      .filter(
                        (d) => d.status === 'available' && d.maxPayloadKg >= offer.packageWeightKg,
                      )
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.droneModel} · up to {d.maxPayloadKg} kg
                        </option>
                      ))}
                  </select>
                  <button disabled={busy || !selection[offer.id]} onClick={() => accept(offer.id)}>
                    Accept order
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
      <section className="card" style={{ marginTop: 24 }}>
        <h2>My deliveries</h2>
        <Orders orders={orders} />
      </section>
    </Shell>
  );
}
