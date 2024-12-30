import { T_ID, T_Item_Admin_Full } from "../types"

type Props = {
  items: T_Item_Admin_Full[];
  name: string;
  address: string;
  phone: string;
  comment: string;
  order: { [key: T_ID]: number };
}

export function generate_email_message({ name, address, phone, comment, order, items }: Props) {

  return {
    subject: "ZIPIT Նոր պատվեր",
    message: `
      <div>
        <p>Պատվիրողի անունը: ${name}</p>
        <p>Պատվիրողի հեռախոսահամարը: ${phone}</p>
        <p>Պատվիրողի հասցեն: ${address}</p>
        <p>Նշումներ: ${comment}</p>
        <p>----------</p>
        
        <div>
          <p>Պատվեր\n</p>
            <p>-</p>
            ${Object.entries(order).reduce((prev, [photo_id, qty]) => {
              const item = items.find(i => i.photo_id === photo_id);
              const m = `
                <p>Անուն: ${item?.name_am}</p>
                <p>Գույն: ${item?.color_am}<p/>
                <p>Չափը: ${item?.size_value}${item?.size_unit}<p/>
                <p>Գին: ${item?.promo ?? item?.price} դրամ<p/>
                <p>Քանակ: ${qty} ${item?.min_order_unit}</p>
                <p>------------------------------</p>
              `;

              return prev + m;
          }, "")}
          <p>
            Ընդհանուր գինը: ${Object.entries(order).reduce((prev, [photo_id, qty]) => {
              const { promo, price } = items.find(i => i.photo_id === photo_id) as T_Item_Admin_Full;
              const prc = promo ?? price;
              return prev + qty * prc;
            }, 0)} դրամ
          </p>
        </div>
      </div>
    `,
  };
}