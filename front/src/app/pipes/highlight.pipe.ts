import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'highlight' })
export class HighlightPipe implements PipeTransform {
  transform(value: string, str: string): string {
    let regEx = new RegExp('(' + str + ')', 'i');
    let replaceMask = '<strong>$1</strong>';

    return '<span>' + value.replace(regEx, replaceMask) + '</span>';
  }
}
