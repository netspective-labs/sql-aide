export interface Component<Identity> {
  readonly component: Identity;
  readonly title?: string;
}

export interface RenderedComponent<T extends Component<string>> {
  readonly component: T;
  readonly SQL: (() => string) | string | string[];
}

export interface Alert extends Component<"alert"> {
  readonly message: string;
  readonly type?: "info" | "warning" | "error";
}

export interface Authentication extends Component<"authentication"> {
  readonly link: string;
  readonly token?: string;
}

export interface Breadcrumb extends Component<"breadcrumb"> {
  readonly items: readonly BreadcrumbItem[];
}

export interface BreadcrumbItem {
  readonly label: string;
  readonly link: string;
}

export interface Button extends Component<"button"> {
  readonly buttons: readonly ButtonItem[];
}

export interface ButtonItem {
  readonly label: string;
  readonly link: string;
  readonly style?: "primary" | "secondary" | "danger";
}

export interface Card extends Component<"card"> {
  readonly items: readonly CardItem[];
}

export interface CardItem {
  readonly title: string;
  readonly content: string;
  readonly image?: string;
  readonly link?: string;
}

export interface Carousel extends Component<"carousel"> {
  readonly images: readonly CarouselImage[];
}

export interface CarouselImage {
  readonly src: string;
  readonly alt?: string;
}

export interface Chart extends Component<"chart"> {
  readonly type: "line" | "bar" | "pie" | "area";
  readonly data: readonly ChartDataPoint[];
}

export interface ChartDataPoint {
  readonly x: string | number;
  readonly y: number;
}

export interface Code extends Component<"code"> {
  readonly language: string;
  readonly code: string;
}

export interface Cookie extends Component<"cookie"> {
  readonly name: string;
  readonly value: string;
  readonly path?: string;
  readonly expires?: string;
}

export interface Csv extends Component<"csv"> {
  readonly filename: string;
  readonly columns: readonly string[];
}

export interface DataGrid extends Component<"datagrid"> {
  readonly items: readonly DataGridItem[];
}

export interface DataGridItem {
  readonly name: string;
  readonly value: string;
}

export interface Debug extends Component<"debug"> {
  readonly data: unknown;
}

export interface Divider extends Component<"divider"> {
  readonly style?: string;
}

export interface Dynamic extends Component<"dynamic"> {
  readonly content: string;
}

export interface Form extends Component<"form"> {
  readonly fields: readonly FormField[];
  readonly action: string;
}

export interface FormField {
  readonly name: string;
  readonly type:
    | "text"
    | "password"
    | "email"
    | "number"
    | "date"
    | "textarea"
    | "select"
    | "checkbox"
    | "radio";
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly options?: readonly string[]; // for select fields
  readonly label?: string;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly minlength?: number;
  readonly maxlength?: number;
  readonly pattern?: string;
  readonly autocomplete?: "on" | "off" | string;
  readonly autofocus?: boolean;
  readonly description?: string;
  readonly checked?: boolean;
}

export interface Hero extends Component<"hero"> {
  readonly description?: string;
  readonly image?: string;
  readonly link?: string;
  readonly linkText?: string;
}

export interface Html extends Component<"html"> {
  readonly content: string;
}

export interface HttpHeader extends Component<"http_header"> {
  readonly headers: Record<string, string>;
}

export interface Json extends Component<"json"> {
  readonly data: unknown;
}

export interface List extends Component<"list"> {
  readonly items: readonly ListItem[];
}

export interface ListItem {
  readonly title: string;
  readonly link?: string;
  readonly description?: string;
  readonly icon?: string;
  readonly active?: boolean;
  readonly color?: string;
  readonly delete_link?: string;
  readonly edit_link?: string;
  readonly image_url?: string;
  readonly view_link?: string;
}

export interface Map extends Component<"map"> {
  readonly markers: readonly MapMarker[];
}

export interface MapMarker {
  readonly latitude: number;
  readonly longitude: number;
  readonly label?: string;
}

export interface Redirect extends Component<"redirect"> {
  readonly url: string;
}

export interface Rss extends Component<"rss"> {
  readonly url: string;
  readonly title: string;
  readonly description?: string;
}

export interface Shell extends Component<"shell"> {
  readonly layout?: "boxed" | "horizontal" | "fluid";
  readonly css?: string;
  readonly favicon?: string;
  readonly javascript?: string;
  readonly language?: string;
  readonly theme?: "dark" | "light";
  readonly title: string;
  readonly description?: string;
  readonly image?: string;
  readonly manifest?: string;
  readonly menu_item?: string | { title: string; submenu: readonly MenuItem[] };
  readonly norobot?: boolean;
  readonly refresh?: number;
  readonly rss?: string;
  readonly search_target?: string;
  readonly search_value?: string;
  readonly social_image?: string;
}

export interface MenuItem {
  readonly title: string;
  readonly link: string;
}

export interface Steps extends Component<"steps"> {
  readonly steps: readonly StepItem[];
}

export interface StepItem {
  readonly label: string;
  readonly link: string;
}

export interface Tab extends Component<"tab"> {
  readonly tabs: readonly TabItem[];
}

export interface TabItem {
  readonly label: string;
  readonly link: string;
  readonly active?: boolean;
}

export interface Table extends Component<"table"> {
  readonly columns: readonly TableColumn[];
  readonly sort?: boolean;
  readonly search?: boolean;
}

export interface TableColumn {
  readonly name: string;
  readonly label?: "markdown" | string;
}

export interface Text extends Component<"text"> {
  readonly content: string;
}

export interface Timeline extends Component<"timeline"> {
  readonly events: readonly TimelineEvent[];
}

export interface TimelineEvent {
  readonly timestamp: string;
  readonly description: string;
}

export interface Title extends Component<"title"> {
  readonly level?: 1 | 2 | 3 | 4 | 5 | 6;
  readonly contents: string;
}

export interface Tracking extends Component<"tracking"> {
  readonly logs: readonly TrackingLog[];
}

export interface TrackingLog {
  readonly timestamp: string;
  readonly action: string;
  readonly user?: string;
}

export function alertSQL(component: Alert): RenderedComponent<Alert> {
  return {
    component,
    SQL: [
      `SELECT '${component.component}' AS component, '${component.message}' AS message${
        component.type ? `, '${component.type}' AS type` : ""
      };`,
    ],
  };
}

export function authenticationSQL(
  component: Authentication,
): RenderedComponent<Authentication> {
  return {
    component,
    SQL: [
      `SELECT '${component.component}' AS component, '${component.link}' AS link${
        component.token ? `, '${component.token}' AS token` : ""
      };`,
    ],
  };
}

export function breadcrumbSQL(
  component: Breadcrumb,
): RenderedComponent<Breadcrumb> {
  return {
    component,
    SQL: [
      `SELECT '${component.component}' AS component;`,
      ...component.items.map((item) =>
        `SELECT '${item.label}' AS label, '${item.link}' AS link;`
      ),
    ],
  };
}

export function buttonSQL(component: Button): RenderedComponent<Button> {
  return {
    component,
    SQL: [
      `SELECT '${component.component}' AS component;`,
      ...component.buttons.map((button) =>
        `SELECT '${button.label}' AS label, '${button.link}' AS link${
          button.style ? `, '${button.style}' AS style` : ""
        };`
      ),
    ],
  };
}

export function cardSQL(component: Card): RenderedComponent<Card> {
  return {
    component,
    SQL: [
      `SELECT '${component.component}' AS component;`,
      ...component.items.map((item) =>
        `SELECT '${item.title}' AS title, '${item.content}' AS content${
          item.image ? `, '${item.image}' AS image` : ""
        }${item.link ? `, '${item.link}' AS link` : ""};`
      ),
    ],
  };
}

export function carouselSQL(component: Carousel): RenderedComponent<Carousel> {
  return {
    component,
    SQL: [
      `SELECT '${component.component}' AS component;`,
      ...component.images.map((image) =>
        `SELECT '${image.src}' AS src${
          image.alt ? `, '${image.alt}' AS alt` : ""
        };`
      ),
    ],
  };
}

export function chartSQL(component: Chart): RenderedComponent<Chart> {
  return {
    component,
    SQL: [
      `SELECT '${component.component}' AS component, '${component.type}' AS type;`,
      ...component.data.map((point) =>
        `SELECT ${
          typeof point.x === "number" ? point.x : `'${point.x}'`
        } AS x, ${point.y} AS y;`
      ),
    ],
  };
}

export function codeSQL(component: Code): RenderedComponent<Code> {
  return {
    component,
    SQL: [
      `SELECT '${component.component}' AS component, '${component.language}' AS language, '${component.code}' AS code;`,
    ],
  };
}

export function cookieSQL(component: Cookie): RenderedComponent<Cookie> {
  return {
    component,
    SQL: [
      `SELECT '${component.component}' AS component, '${component.name}' AS name, '${component.value}' AS value${
        component.path ? `, '${component.path}' AS path` : ""
      }${component.expires ? `, '${component.expires}' AS expires` : ""};`,
    ],
  };
}

export function csvSQL(component: Csv): RenderedComponent<Csv> {
  return {
    component,
    SQL: [
      `SELECT '${component.component}' AS component, '${component.filename}' AS filename, ${
        component.columns.map((col) => `'${col}'`).join(", ")
      } AS columns;`,
    ],
  };
}

export function datagridSQL(component: DataGrid): RenderedComponent<DataGrid> {
  return {
    component,
    SQL: [
      `SELECT '${component.component}' AS component;`,
      ...component.items.map((item) =>
        `SELECT '${item.name}' AS name, '${item.value}' AS value;`
      ),
    ],
  };
}

export function debugSQL(component: Debug): RenderedComponent<Debug> {
  return {
    component,
    SQL: [
      `SELECT '${component.component}' AS component, ${
        JSON.stringify(component.data)
      } AS data;`,
    ],
  };
}

export function dividerSQL(component: Divider): RenderedComponent<Divider> {
  return {
    component,
    SQL: [
      `SELECT '${component.component}' AS component${
        component.style ? `, '${component.style}' AS style` : ""
      };`,
    ],
  };
}

export function dynamicSQL(component: Dynamic): RenderedComponent<Dynamic> {
  return {
    component,
    SQL: [
      `SELECT '${component.component}' AS component, '${component.content}' AS content;`,
    ],
  };
}

export function formSQL(component: Form): RenderedComponent<Form> {
  return {
    component,
    SQL: [
      `SELECT '${component.component}' AS component, '${component.action}' AS action;`,
      ...component.fields.map((field) => {
        let fieldSQL =
          `SELECT '${field.name}' AS name, '${field.type}' AS type`;
        if (field.placeholder) {
          fieldSQL += `, '${field.placeholder}' AS placeholder`;
        }
        if (field.required) fieldSQL += `, TRUE AS required`;
        if (field.options) {
          fieldSQL += `, '${field.options.join(", ")}' AS options`;
        }
        if (field.label) fieldSQL += `, '${field.label}' AS label`;
        if (field.min !== undefined) fieldSQL += `, ${field.min} AS min`;
        if (field.max !== undefined) fieldSQL += `, ${field.max} AS max`;
        if (field.step !== undefined) fieldSQL += `, ${field.step} AS step`;
        if (field.minlength !== undefined) {
          fieldSQL += `, ${field.minlength} AS minlength`;
        }
        if (field.maxlength !== undefined) {
          fieldSQL += `, ${field.maxlength} AS maxlength`;
        }
        if (field.pattern) fieldSQL += `, '${field.pattern}' AS pattern`;
        if (field.autocomplete) {
          fieldSQL += `, '${field.autocomplete}' AS autocomplete`;
        }
        if (field.autofocus) fieldSQL += `, TRUE AS autofocus`;
        if (field.description) {
          fieldSQL += `, '${field.description}' AS description`;
        }
        if (field.checked !== undefined) {
          fieldSQL += `, ${field.checked} AS checked`;
        }
        return fieldSQL + ";";
      }),
    ],
  };
}

export function heroSQL(component: Hero): RenderedComponent<Hero> {
  return {
    component,
    SQL: [
      `SELECT '${component.component}' AS component${
        component.description
          ? `, '${component.description}' AS description`
          : ""
      }${component.image ? `, '${component.image}' AS image` : ""}${
        component.link ? `, '${component.link}' AS link` : ""
      }${component.linkText ? `, '${component.linkText}' AS linkText` : ""};`,
    ],
  };
}

export function htmlSQL(component: Html): RenderedComponent<Html> {
  return {
    component,
    SQL: [
      `SELECT '${component.component}' AS component, '${component.content}' AS content;`,
    ],
  };
}

export function httpHeaderSQL(
  component: HttpHeader,
): RenderedComponent<HttpHeader> {
  return {
    component,
    SQL: [
      `SELECT '${component.component}' AS component;`,
      ...Object.keys(component.headers).map((key) =>
        `SELECT '${key}' AS name, '${component.headers[key]}' AS value;`
      ),
    ],
  };
}

export function jsonSQL(component: Json): RenderedComponent<Json> {
  return {
    component,
    SQL: [
      `SELECT '${component.component}' AS component, ${
        JSON.stringify(component.data)
      } AS data;`,
    ],
  };
}

export function listSQL(component: List): RenderedComponent<List> {
  return {
    component,
    SQL: [
      `SELECT '${component.component}' AS component;`,
      ...component.items.map((item) => {
        let itemSQL = `SELECT '${item.title}' AS title`;
        if (item.link) itemSQL += `, '${item.link}' AS link`;
        if (item.description) {
          itemSQL += `, '${item.description}' AS description`;
        }
        if (item.icon) itemSQL += `, '${item.icon}' AS icon`;
        if (item.active) itemSQL += `, TRUE AS active`;
        if (item.color) itemSQL += `, '${item.color}' AS color`;
        if (item.delete_link) {
          itemSQL += `, '${item.delete_link}' AS delete_link`;
        }
        if (item.edit_link) itemSQL += `, '${item.edit_link}' AS edit_link`;
        if (item.image_url) itemSQL += `, '${item.image_url}' AS image_url`;
        if (item.view_link) itemSQL += `, '${item.view_link}' AS view_link`;
        return itemSQL + ";";
      }),
    ],
  };
}

export function mapSQL(component: Map): RenderedComponent<Map> {
  return {
    component,
    SQL: [
      `SELECT '${component.component}' AS component;`,
      ...component.markers.map((marker) =>
        `SELECT ${marker.latitude} AS latitude, ${marker.longitude} AS longitude${
          marker.label ? `, '${marker.label}' AS label` : ""
        };`
      ),
    ],
  };
}

export function redirectSQL(component: Redirect): RenderedComponent<Redirect> {
  return {
    component,
    SQL: [
      `SELECT '${component.component}' AS component, '${component.url}' AS url;`,
    ],
  };
}

export function rssSQL(component: Rss): RenderedComponent<Rss> {
  return {
    component,
    SQL: [
      `SELECT '${component.component}' AS component, '${component.url}' AS url${
        component.title ? `, '${component.title}' AS title` : ""
      }${
        component.description
          ? `, '${component.description}' AS description`
          : ""
      };`,
    ],
  };
}

export function shellSQL(component: Shell): RenderedComponent<Shell> {
  let shellSQL = `SELECT '${component.component}' AS component`;
  if (component.layout) shellSQL += `, '${component.layout}' AS layout`;
  if (component.css) shellSQL += `, '${component.css}' AS css`;
  if (component.favicon) shellSQL += `, '${component.favicon}' AS favicon`;
  if (component.javascript) {
    shellSQL += `, '${component.javascript}' AS javascript`;
  }
  if (component.language) shellSQL += `, '${component.language}' AS language`;
  if (component.theme) shellSQL += `, '${component.theme}' AS theme`;
  if (component.title) shellSQL += `, '${component.title}' AS title`;
  if (component.description) {
    shellSQL += `, '${component.description}' AS description`;
  }
  if (component.image) shellSQL += `, '${component.image}' AS image`;
  if (component.manifest) shellSQL += `, '${component.manifest}' AS manifest`;
  if (component.menu_item) {
    if (typeof component.menu_item === "string") {
      shellSQL += `, '${component.menu_item}' AS menu_item`;
    } else {
      shellSQL += `, '${component.menu_item.title}' AS menu_item_title, ${
        component.menu_item.submenu.map((sub) =>
          `'${sub.title}' AS title, '${sub.link}' AS link`
        ).join(", ")
      } AS submenu`;
    }
  }
  if (component.norobot) shellSQL += `, TRUE AS norobot`;
  if (component.refresh) shellSQL += `, ${component.refresh} AS refresh`;
  if (component.rss) shellSQL += `, '${component.rss}' AS rss`;
  if (component.search_target) {
    shellSQL += `, '${component.search_target}' AS search_target`;
  }
  if (component.search_value) {
    shellSQL += `, '${component.search_value}' AS search_value`;
  }
  if (component.social_image) {
    shellSQL += `, '${component.social_image}' AS social_image`;
  }
  return { component, SQL: [shellSQL + ";"] };
}

export function stepsSQL(component: Steps): RenderedComponent<Steps> {
  return {
    component,
    SQL: [
      `SELECT '${component.component}' AS component;`,
      ...component.steps.map((step) =>
        `SELECT '${step.label}' AS label, '${step.link}' AS link;`
      ),
    ],
  };
}

export function tabSQL(component: Tab): RenderedComponent<Tab> {
  return {
    component,
    SQL: [
      `SELECT '${component.component}' AS component;`,
      ...component.tabs.map((tab) =>
        `SELECT '${tab.label}' AS label, '${tab.link}' AS link${
          tab.active ? `, TRUE AS active` : ""
        };`
      ),
    ],
  };
}

export function tableSQL(component: Table): RenderedComponent<Table> {
  return {
    component,
    SQL: [
      `SELECT '${component.component}' AS component${
        component.sort ? `, ${component.sort} AS sort` : ""
      }${component.search ? `, ${component.search} AS search` : ""};`,
      ...component.columns.map((column) =>
        `'${column.name}'${column.label ? `, ' AS ${column.label}'` : ""};`
      ),
    ],
  };
}

export function textSQL(component: Text): RenderedComponent<Text> {
  return {
    component,
    SQL: [
      `SELECT '${component.component}' AS component, '${component.content}' AS content;`,
    ],
  };
}

export function timelineSQL(component: Timeline): RenderedComponent<Timeline> {
  return {
    component,
    SQL: [
      `SELECT '${component.component}' AS component;`,
      ...component.events.map((event) =>
        `SELECT '${event.timestamp}' AS timestamp, '${event.description}' AS description;`
      ),
    ],
  };
}

export function titleSQL(component: Title): RenderedComponent<Title> {
  return {
    component,
    SQL: [
      `SELECT '${component.component}' AS component, '${component.contents}' AS contents, ${
        component.level ?? 1
      } AS level;`,
    ],
  };
}

export function trackingSQL(component: Tracking): RenderedComponent<Tracking> {
  return {
    component,
    SQL: [
      `SELECT '${component.component}' AS component;`,
      ...component.logs.map((log) =>
        `SELECT '${log.timestamp}' AS timestamp, '${log.action}' AS action${
          log.user ? `, '${log.user}' AS user` : ""
        };`
      ),
    ],
  };
}
