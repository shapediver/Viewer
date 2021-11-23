import 'reflect-metadata'
import { build_data } from '@shapediver/viewer.shared.build-data'

(() => {
    const p = document.createElement('p');
    
    p.style.fontFamily = 'roboto-regular,Helvetica,Roboto,Arial,sans-serif';
    p.style.fontWeight = '400';
    p.style.fontSize = '20px';

    document.body.appendChild(p)
    p.innerText = `${build_data.build_version.replace('3.', '')}`;
})()

