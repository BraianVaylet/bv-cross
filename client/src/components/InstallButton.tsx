import { useEffect, useState } from 'react';
import { clearInstallPrompt, getInstallPrompt, subscribeInstall } from '../lib/pwaInstall';
import { DownloadIcon } from './Icons';
import { Modal } from './ui';

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

/** ¿La app ya corre instalada (standalone)? Entonces no ofrecemos instalar. */
const isStandalone = () => {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
};

const iconBtn =
  'flex h-10 w-10 items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-raised hover:text-ink';

/**
 * Botón para instalar la web app en el dispositivo. Solo aparece si el navegador
 * la considera instalable (`beforeinstallprompt`) o si es iOS (que no soporta ese
 * evento y requiere el paso manual "Agregar a inicio").
 */
export function InstallButton() {
  const [prompt, setPrompt] = useState(getInstallPrompt);
  const [iosHelp, setIosHelp] = useState(false);

  useEffect(() => subscribeInstall(() => setPrompt(getInstallPrompt())), []);

  if (isStandalone()) return null;
  const ios = isIOS();
  if (!prompt && !ios) return null;

  const onClick = async () => {
    if (prompt) {
      await prompt.prompt();
      await prompt.userChoice;
      clearInstallPrompt();
      setPrompt(null);
    } else {
      setIosHelp(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-label="Instalar app"
        title="Instalar app"
        className={iconBtn}
      >
        <DownloadIcon className="h-5 w-5" />
      </button>

      <Modal open={iosHelp} onClose={() => setIosHelp(false)} title="Instalar en tu iPhone">
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-ink">
          <li>
            Tocá el botón <strong>Compartir</strong> en la barra de Safari.
          </li>
          <li>
            Elegí <strong>Agregar a pantalla de inicio</strong>.
          </li>
          <li>
            Confirmá con <strong>Agregar</strong>.
          </li>
        </ol>
        <p className="mt-3 text-xs text-ink-dim">
          En iPhone la instalación es manual: no hay un botón automático como en Android.
        </p>
      </Modal>
    </>
  );
}
