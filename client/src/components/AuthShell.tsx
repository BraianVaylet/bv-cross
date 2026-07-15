import type { ReactNode } from 'react';
import { AuthLayout } from '@medano-ui/react';
import { Logo } from './ui';

/**
 * Layout de autenticación. Usa el template único de la familia (AuthLayout de
 * medano); lo propio de cross es el logo y el nombre.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <AuthLayout logo={<Logo />} appName="BV Cross" title={title} subtitle={subtitle} footer={footer}>
      {children}
    </AuthLayout>
  );
}
