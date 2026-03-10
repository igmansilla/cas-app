import type { Meta, StoryObj } from '@storybook/react';
import { PlanPagoCard } from './PlanPagoCard';
import { AudienciaPlan, EstrategiaPlan } from '../../api/schemas/pagos';

const meta = {
  title: 'Pagos/PlanPagoCard',
  component: PlanPagoCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onInscribirse: { action: 'clicked' },
  },
  args: {
    onInscribirse: () => {},
  },
  decorators: [
    (Story) => (
      <div className="w-[350px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PlanPagoCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const planBase = {
  id: 1,
  codigo: 'PLAN_A_2026',
  nombre: 'Plan Escala Mayor 2026',
  descripcion: 'Plan principal de financiamiento.',
  estrategia: EstrategiaPlan.PLAN_A,
  audiencia: AudienciaPlan.ACAMPANTE,
  montoTotal: 1000000,
  maxCuotas: 10,
  anio: 2026,
  mesLimiteInscripcion: 3,
  mesInicioControlAtraso: 4,
  activo: true,
  mesInicio: 3,
  mesFin: 12,
};

export const PlanAAbierto: Story = {
  args: {
    plan: { ...planBase, estrategia: EstrategiaPlan.PLAN_A, nombre: 'Aporte Ideal (Plan A)' },
    abierto: true,
    mensaje: 'Hasta Mar',
  },
};

export const PlanACerrado: Story = {
  args: {
    plan: { ...planBase, estrategia: EstrategiaPlan.PLAN_A, nombre: 'Aporte Ideal (Plan A)' },
    abierto: false,
    mensaje: 'Inscripción cerró en Mar',
  },
};

export const PlanBAbierto: Story = {
  args: {
    plan: { ...planBase, estrategia: EstrategiaPlan.PLAN_B, nombre: 'Plan Post-Campamento (Plan B)', maxCuotas: 6 },
    abierto: true,
    mensaje: 'Hasta Jul',
  },
};

export const PlanCAbierto: Story = {
  args: {
    plan: { ...planBase, estrategia: EstrategiaPlan.PLAN_C, nombre: 'Plan Directo', audiencia: AudienciaPlan.DIRIGENTE, maxCuotas: 3 },
    abierto: true,
    mensaje: 'Hasta Nov',
  },
};
