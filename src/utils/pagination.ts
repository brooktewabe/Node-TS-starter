export interface PaginatedResult<T> {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    data: T[];
}

export async function paginate<T>(
    model: any, 
    page: number = 1, 
    limit: number = 10, 
    filter: object = {}, 
    sort: object = { createdAt: -1 }
): Promise<PaginatedResult<T>> {
    const skip = (page - 1) * limit;

    const [data, totalItems] = await Promise.all([
        model.find(filter).sort(sort).skip(skip).limit(limit),
        model.countDocuments(filter)
    ]);

    return {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        data,
    };
}
