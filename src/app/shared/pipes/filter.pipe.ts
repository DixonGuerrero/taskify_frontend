import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  standalone: true
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], searchText: string, property?: string): any[] {
    if (!items) return [];
    if (!searchText) return items;

    searchText = searchText.toLowerCase();

    return items.filter(item => {
      if (property) {
        return item[property].toLowerCase().includes(searchText);
      } else {
        return Object.keys(item).some(key => {
          if (typeof item[key] === 'string') {
            return item[key].toLowerCase().includes(searchText);
          }
          return false;
        });
      }
    });
  }
}