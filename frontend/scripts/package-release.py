"""Package an already built frontend; no install is performed by the runtime launcher."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import shutil

frontend = Path(__file__).resolve().parents[1]
repo = frontend.parent
stage = Path('/workspace/exports/WeldVision-Acquisition-v3')
if stage.exists():
    shutil.rmtree(stage)
stage.mkdir(parents=True)
for p in (frontend / 'distribution').iterdir():
    shutil.copy2(p, stage / p.name)
shutil.copytree(frontend / '.next/standalone', stage / 'runtime')
def ignore(directory, names):
    return [n for n in names if n in {'.next', 'node_modules', 'distribution', 'test-results', 'playwright-report'} or n.endswith('.tsbuildinfo') or (n.startswith('.env') and n != '.env.example') or (Path(directory).name == 'screenshots' and not n.startswith('acquisition-v3'))]
shutil.copytree(frontend, stage / 'frontend', ignore=ignore)
output = repo / 'deliverables/WeldVision-Acquisition-v3.zip'
with ZipFile(output, 'w', ZIP_DEFLATED, compresslevel=6) as archive:
    for p in sorted(stage.rglob('*')):
        if p.is_file():
            archive.write(p, Path(stage.name) / p.relative_to(stage))
print(f'{output}: {output.stat().st_size:,} bytes')
