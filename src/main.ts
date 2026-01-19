
import { bindNumberDragger } from './NumberDragger.ts';

function assert(b: boolean): asserts b {
    if (!b)
        throw new Error(`Assert: ${b}`);
}

interface PixelFormat {
    formatName: string;
    formatGroup: string;
    formatDescription: string;
    blockWidth: number;
    blockHeight: number;
    bytesPerBlock: number;
}

function buildFormats(): PixelFormat[] {
    const formats: PixelFormat[] = [];

    function simplePixelFormat(formatName: string, customDescription: string | null = null, customGroup: string | null = null): PixelFormat {
        const blockWidth = 1, blockHeight = 1;
        let bytesPerBlock = 0;

        const sections = formatName.split('_');
        assert(sections.length % 2 === 0);

        // 'R32G32' => [['R32', 'R', '32'], ['G32', 'G', '32']]
        const extractChannels = (channelDetails: string) => {
            return [...channelDetails.matchAll(/([RGBADSX])(\d+)/g)];
        };

        for (let i = 0; i < sections.length; i += 2) {
            const channelDetails = sections[i + 0];
            const channelFormat = sections[i + 1];
            const possibleFormats = ['FLOAT', 'UINT', 'SINT', 'UNORM', 'SNORM'];
            assert(possibleFormats.includes(channelFormat));

            const channels = extractChannels(channelDetails);
            const totalBitsPerChannel = channels.map((g) => Number(g[2])).reduce((a, b) => a + b, 0);
            bytesPerBlock += totalBitsPerChannel / 8;
        }

        let formatGroup = ``;
        if (customGroup !== null) {
            formatGroup = customGroup;
        } else {
            assert(sections.length === 2);

            const channelDetails = sections[0];
            const channelFormat = sections[1];

            if (channelDetails.includes('D'))
                formatGroup = 'Depth-Stencil Formats';
            else if (channelFormat === 'FLOAT')
                formatGroup = 'Floating-Point Formats';
            else if (channelFormat === 'UINT' || channelFormat === 'SINT')
                formatGroup = 'Integer Formats';
            else if (channelFormat === 'UNORM' || channelFormat === 'SNORM')
                formatGroup = 'Normalized Formats';
        }

        let formatDescription = ``;
        if (customDescription !== null) {
            formatDescription = customDescription;
        } else {
            assert(sections.length === 2);

            const channelDetails = sections[0];
            const channelFormat = sections[1];

            // Assert all the bit-nesses are the same; otherwise, you should have written a custom description.
            const channels = extractChannels(channelDetails);
            channels.forEach(([_, ch, bits]) => {
                assert(channels[0][2] === bits);
            });

            const bits = channels[0][2];
            const formatStr =
                channelFormat === 'UNORM' ? 'UNORM-normalized' :
                channelFormat === 'SNORM' ? 'SNORM-normalized' :
                channelFormat === 'UINT' ? 'unsigned' :
                channelFormat === 'SINT' ? 'signed' :
                channelFormat === 'FLOAT' ? 'float' : '';
            const channelsStr = channels.length === 1 ? `${channels[0][1]} channel` :
                channels.length === 2 ? `${channels[0][1]} and ${channels[1][1]} channels` :
                channels.length === 3 ? `${channels[0][1]}, ${channels[1][1]}, and ${channels[2][1]} channels` :
                channels.length === 4 ? `${channels[0][1]}, ${channels[1][1]}, ${channels[2][1]}, and ${channels[3][1]} channels` : '';
            formatDescription = `Each pixel contains ${formatStr} ${bits}-bit ${channelsStr}, totalling ${bytesPerBlock * 8} per pixel (${bytesPerBlock} bytes per pixel).`;
        }

        const format: PixelFormat = { formatName, formatGroup, formatDescription, blockWidth, blockHeight, bytesPerBlock };
        formats.push(format);
        return format;
    }

    // Based on https://learn.microsoft.com/en-us/windows/win32/api/dxgiformat/ne-dxgiformat-dxgi_format
    // e.g. R8G8B8A8_UNORM, R32G32B32_UINT, D32_FLOAT_S8X24_UINT

    // Normalized Formats
    simplePixelFormat('R8G8B8A8_UNORM', 'Each pixel contains UNORM-normalized 8-bit R, G, B, and A channels, totalling 32 bits per pixel (4 bytes per pixel).');
    simplePixelFormat('R8G8_UNORM');
    simplePixelFormat('R8_UNORM');
    simplePixelFormat('R10G10B10A2_UNORM', 'Each pixel contains UNORM-normalized 10-bit R, G, and B channels, along with a 2-bit A channel, totalling 32 bits per pixel (4 bytes per pixel)');
    simplePixelFormat('R16G16B16A16_UNORM');
    simplePixelFormat('R16G16_UNORM');
    simplePixelFormat('R16_UNORM');

    simplePixelFormat('R8G8B8A8_SNORM');
    simplePixelFormat('R8_SNORM');
    simplePixelFormat('R16G16B16A16_SNORM');
    simplePixelFormat('R16G16_SNORM');
    simplePixelFormat('R8G8_SNORM');
    simplePixelFormat('R16_SNORM');

    // Depth-Stencil Formats
    simplePixelFormat('D24_UNORM_S8_UINT', 'Each pixel contains 24-bit Depth and 8-bit stencil, totalling 32 bits per pixel (4 bytes per pixel)', 'Depth-Stencil Formats');
    simplePixelFormat('D16_UNORM', 'Each pixel contains 16-bit Depth with no stencil, totalling 16-bits per pixel (2 bytes per pixel)');
    simplePixelFormat('D32_FLOAT', 'Each pixel contains 32-bit Depth with no stencil, totalling 32-bits per pixel (4 bytes per pixel)');

    // Float Formats
    simplePixelFormat('R32G32B32A32_FLOAT');
    simplePixelFormat('R32G32B32_FLOAT');
    simplePixelFormat('R16G16B16A16_FLOAT');
    simplePixelFormat('R32G32_FLOAT');
    simplePixelFormat('R11G11B10_FLOAT', 'Each pixel contains floating-point 11-bit R and G channels, along with a 10-bit B channel, totalling 32-bits per pixel (4 bytes per pixel).');
    simplePixelFormat('R16G16_FLOAT');
    simplePixelFormat('R32_FLOAT');
    simplePixelFormat('R16_FLOAT');

    // Integer Formats
    simplePixelFormat('R32G32B32A32_UINT');
    simplePixelFormat('R32G32B32A32_SINT');
    simplePixelFormat('R32G32B32_UINT');
    simplePixelFormat('R32G32B32_SINT');
    simplePixelFormat('R16G16B16A16_UINT');
    simplePixelFormat('R16G16B16A16_SINT');
    simplePixelFormat('R32G32_UINT');
    simplePixelFormat('R32G32_SINT');
    simplePixelFormat('R10G10B10A2_UINT', 'Each pixel contains unsigned 10-bit R, G, and B channels, along with a 2-bit A channel, totalling 32 bits per pixel (4 bytes per pixel)');
    simplePixelFormat('R8G8B8A8_UINT');
    simplePixelFormat('R8G8B8A8_SINT');
    simplePixelFormat('R16G16_UINT');
    simplePixelFormat('R16G16_SINT');
    simplePixelFormat('R32_UINT');
    simplePixelFormat('R32_SINT');
    simplePixelFormat('R8G8_UINT');
    simplePixelFormat('R8G8_SINT');
    simplePixelFormat('R16_UINT');
    simplePixelFormat('R16_SINT');
    simplePixelFormat('R8_UINT');
    simplePixelFormat('R8_SINT');

    // https://www.reedbeta.com/blog/understanding-bcn-texture-compression-formats/#comparison-table
    formats.push({ formatName: 'BC1', formatGroup: 'BC Formats', blockWidth: 4, blockHeight: 4, bytesPerBlock: 8,
        formatDescription: 'Block-Compressed BC1, containing packed 4x4 blocks. Each block contains RGB data and 1-bit alpha, totalling 0.5 bytes per pixel.',
    });
    formats.push({ formatName: 'BC2', formatGroup: 'BC Formats', blockWidth: 4, blockHeight: 4, bytesPerBlock: 16,
        formatDescription: 'Block-Compressed BC2, containing packed 4x4 blocks. Each block contains RGB data and 4-bit alpha, totalling 1 byte per pixel.',
    });
    formats.push({ formatName: 'BC3', formatGroup: 'BC Formats', blockWidth: 4, blockHeight: 4, bytesPerBlock: 16,
        formatDescription: 'Block-Compressed BC3, containing packed 4x4 blocks. Each block contains RGB data and separately packed alpha, totalling 1 byte per pixel.',
    });
    formats.push({ formatName: 'BC4', formatGroup: 'BC Formats', blockWidth: 4, blockHeight: 4, bytesPerBlock: 8,
        formatDescription: 'Block-Compressed BC4, containing packed 4x4 blocks. Each block contains a single channel packed in high quality, totalling 0.5 bytes per pixel.',
    });
    formats.push({ formatName: 'BC5', formatGroup: 'BC Formats', blockWidth: 4, blockHeight: 4, bytesPerBlock: 16,
        formatDescription: 'Block-Compressed BC5, containing packed 4x4 blocks. Each block contains two channels packed in high quality, totalling 1 byte per pixel.',
    });
    formats.push({ formatName: 'BC6', formatGroup: 'BC Formats', blockWidth: 4, blockHeight: 4, bytesPerBlock: 16,
        formatDescription: 'Block-Compressed BC6, containing packed 4x4 blocks. Each block contains RGB floating-point data meant for HDR images, totalling 1 byte per pixel.',
    });
    formats.push({ formatName: 'BC7', formatGroup: 'BC Formats', blockWidth: 4, blockHeight: 4, bytesPerBlock: 16,
        formatDescription: 'Block-Compressed BC7, containing packed 4x4 blocks. Each block contains either RGB or RGBA data, packed using a complex scheme, totalling 1 byte per pixel.',
    });

    formats.push({ formatName: "Custom", formatGroup: "Custom", formatDescription: "",
        blockWidth: 0,
        blockHeight: 0,
        bytesPerBlock: 0,
    });

    return formats;
}

interface Image extends PixelFormat {
    width: number;
    height: number;
}

function getImageFromValues(pixelFormat: PixelFormat): Image {
    const width = document.querySelector<HTMLInputElement>('#ImageWidth')!.valueAsNumber;
    const height = document.querySelector<HTMLInputElement>('#ImageHeight')!.valueAsNumber;

    if (pixelFormat.formatName === 'Custom') {
        const blockWidth = document.querySelector<HTMLInputElement>('#CustomBlockWidth')!.valueAsNumber;
        const blockHeight = document.querySelector<HTMLInputElement>('#CustomBlockHeight')!.valueAsNumber;
        const bytesPerBlock = document.querySelector<HTMLInputElement>('#CustomBytesPerBlock')!.valueAsNumber;
        return { width, height, ... pixelFormat, blockWidth, blockHeight, bytesPerBlock };
    } else {
        return { width, height, ... pixelFormat };
    }
}

interface SingleMip {
    width: number;
    height: number;
    paddedWidth: number;
    paddedHeight: number;
    byteSize: number;
    offset: number;
}

function clearElement(c: HTMLElement): void {
    while (c.firstChild)
        c.removeChild(c.firstChild);
}

function buildSingleMip(image: Image, width: number, height: number, offset: number): SingleMip {
    const blocksW = Math.ceil(width / image.blockWidth);
    const blocksH = Math.ceil(height / image.blockHeight);
    const paddedWidth = blocksW * image.blockWidth;
    const paddedHeight = blocksH * image.blockHeight;
    const byteSize = blocksW * blocksH * image.bytesPerBlock;

    return {
        width, height,
        paddedWidth, paddedHeight,
        byteSize, offset,
    };
}

function buildMipChain(image: Image): SingleMip[] {
    const mips: SingleMip[] = [];
    let w = image.width, h = image.height;
    let offset = 0;
    while (true) {
        const mip = buildSingleMip(image, w, h, offset);
        mips.push(mip);
        offset += mip.byteSize;
        if (w <= 1 && h <= 1)
            break;

        if (w > 1)
            w >>= 1;
        if (h > 1)
            h >>= 1;
    }
    return mips;
}

function leftPad(S: string, spaces: number, ch: string = '0'): string {
    return S.padStart(spaces, ch);
}

function hexzero(n: number, spaces: number): string {
    let S = (n >>> 0).toString(16);
    return leftPad(S, spaces);
}

function hexzero0x(n: number, spaces: number = 8): string {
    if (n < 0)
        return `-0x${hexzero(-n, spaces)}`;
    else
        return `0x${hexzero(n, spaces)}`;
}

let selectedPixelFormat: PixelFormat = null!;

function rebuildOutput() {
    const isCustomFormat = (selectedPixelFormat.formatName === 'Custom');

    const customFormatForm = document.querySelector<HTMLElement>('#CustomFormat')!;
    customFormatForm.style.display = isCustomFormat ? 'block' : 'none';

    const formatDescription = document.querySelector<HTMLElement>('#FormatDescription')!;
    formatDescription.innerHTML = selectedPixelFormat.formatDescription;

    const image = getImageFromValues(selectedPixelFormat);
    const mipChain = buildMipChain(image);
    const preview = document.querySelector<HTMLElement>('#TexturePreview')!;
    const output = document.querySelector<HTMLElement>('#OutputLog')!;
    clearElement(output);
    clearElement(preview);

    const previewMaxWidth = 600;
    const previewScale = Math.min(previewMaxWidth / mipChain[0].width, 1);

    for (let i = 0; i < mipChain.length; i++) {
        const mip = mipChain[i];

        const mipPreview = document.createElement('div');
        mipPreview.style.background = `repeating-conic-gradient(#539fea 0% 25%, #3a83cb 0% 50%)`;
        mipPreview.style.backgroundSize = `2em 2em`;
        mipPreview.style.width = `${mip.width * previewScale}px`;
        mipPreview.style.height = `${mip.height * previewScale}px`;
        mipPreview.style.display = 'grid';
        mipPreview.style.placeContent = 'center';
        if (i === 0)
            mipPreview.style.float = 'left';
        mipPreview.textContent = `${mip.width}x${mip.height}`;

        preview.appendChild(mipPreview);

        const line = document.createElement('div');
        line.innerHTML = `Mip ${i}, ${mip.width}x${mip.height} (${mip.paddedWidth}x${mip.paddedHeight}), ${hexzero0x(mip.byteSize)} bytes, starting at ${hexzero0x(mip.offset)}`;
        output.appendChild(line);

        const setSelected = (b: boolean) => {
            line.classList.toggle('Selected', b);
            mipPreview.classList.toggle('Selected', b);
        };

        mipPreview.onmouseenter = () => setSelected(true);
        mipPreview.onmouseleave = () => setSelected(false);

        line.onmouseenter = () => setSelected(true);
        line.onmouseleave = () => setSelected(false);

        if (i === 0)
            setSelected(true);
    }

    const totalSize = mipChain.reduce((a, b) => a + b.byteSize, 0);
    const line = document.createElement('div');
    line.innerHTML = `Total Size: ${hexzero0x(totalSize)}`;
    output.appendChild(line);
}

function main() {
    const buildFormatSelect = () => {
        const formatSelect = document.querySelector<HTMLSelectElement>('#FormatSelect')!;
        const pixelFormats = buildFormats();
        let currentGroup: string | null = null;
        let currentOptGroup: HTMLOptGroupElement | null = null;

        pixelFormats.forEach((format, i) => {
            if (format.formatGroup !== currentGroup) {
                currentOptGroup = document.createElement('optgroup');
                currentOptGroup.label = format.formatGroup;
                currentGroup = format.formatGroup;
                formatSelect.appendChild(currentOptGroup);
            }

            const option = document.createElement('option');
            option.textContent = format.formatName;
            option.dataset.formatNo = '' + i;
            currentOptGroup!.appendChild(option);
        });

        formatSelect.oninput = () => {
            const option = formatSelect.selectedOptions[0];
            selectedPixelFormat = pixelFormats[option.dataset.formatNo!];
            rebuildOutput();
        };

        selectedPixelFormat = pixelFormats[0];
    };

    buildFormatSelect();

    document.querySelectorAll<HTMLInputElement>('input').forEach((input) => {
        input.oninput = rebuildOutput;
        input.draggable = false;
        bindNumberDragger(input, (value) => {
            value = Math.max(value, 1);
            input.valueAsNumber = value;
            rebuildOutput();
        });
    });

    rebuildOutput();
}

window.onload = main;
